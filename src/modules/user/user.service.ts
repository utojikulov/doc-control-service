import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    private readonly SALT_ROUNDS = 10
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    async getByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email }
        })
    }

    async createUser(dto: CreateUserDto) {
        try {
            const user = {
                email: dto.email,
                password: await bcrypt.hash(dto.password, this.SALT_ROUNDS),
                version: 0
            }

            const result = await this.prisma.$transaction(
                async (tx) => {
                    return await tx.user.create({
                        data: user,
                        select: {
                            id: true,
                            email: true,
                            createdAt: true,
                            updatedAt: true,
                            version: true,
                        }
                    })
                }, {
                    isolationLevel: 'ReadCommitted',
                    timeout: 3000
                }
            )

            return result
        } catch (error) {
            throw new ConflictException(`Error occured while creating a user: ${error}`);
        }
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                document: true
            }
        })

        if (!user) throw new NotFoundException(`User with id: ${id} not found.`)

        return user
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: {email}
        })

        if (!user) throw new NotFoundException(`User with email: ${email} not found.`)

        return user
    }

    async update(id: string, dto: UpdateUserDto) {
        try {
            if (!dto) throw new BadRequestException('No data provided for the update.')

            const currentUser = await this.prisma.user.findUnique({
                where: {id},
                select: {
                    version: true,
                    password: true
                }
            })

            if (!currentUser) throw new NotFoundException(`User with id: ${id} not found.`)

            if (dto.version === undefined) {
                throw new BadRequestException('Version number is required for optimistic locking.')
            }

            if (dto.version !== currentUser?.version) {
                throw new ConflictException('User was modified by another process.')
            }

            let data= { ...dto }


            if (dto.password) {
                data = { ...dto, password: await bcrypt.hash(dto.password, this.SALT_ROUNDS)}
            }
            
            const updatedUser = await this.prisma.$transaction(
                async (tx) => {
                    return await tx.user.update({
                        where: {
                            id,
                            version: currentUser.version
                        },
                        data: {
                            ...data,
                            version: { increment: 1 }
                        },
                        select: {
                            id: true,
                            email: true,
                            version: true,
                            updatedAt: true
                        }
                    })
                },
                {
                    isolationLevel: 'ReadCommitted'
                }
            )

            return updatedUser

        } catch (error) {
            throw new Error(`Error occured while updateing user data: ${error}`)
        }
    }

    //softdelete

    //harddelete
}
