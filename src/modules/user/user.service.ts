import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { CreateUserDto } from './dto/create-user.dto'
import * as bcrypt from 'bcrypt'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserProfileDto } from './dto/user-profile.dto'

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
                async tx => {
                    return await tx.user.create({
                        data: user
                    })
                },
                {
                    isolationLevel: 'ReadCommitted',
                    timeout: 3000
                }
            )

            return result
        } catch (error) {
            throw new ConflictException(
                `Error occured while creating a user: ${error}`
            )
        }
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                version: true,
                createdAt: true,
                updatedAt: true,
                document: true
            }
        })

        if (!user) throw new NotFoundException(`User with id: ${id} not found.`)

        return user
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email }
        })

        if (!user)
            throw new NotFoundException(`User with email: ${email} not found.`)

        return user
    }

    async update(id: string, dto: UpdateUserDto) {
        try {
            if (!dto)
                throw new BadRequestException('No data provided for the update.')

            return await this.prisma.$transaction(
                async tx => {
                    const currentUser = await tx.user.findUnique({
                        where: { id },
                        select: {
                            version: true,
                            password: true,
                            email: true
                        }
                    })

                    if (dto.version !== currentUser?.version) {
                        throw new ConflictException(
                            'User was modified by another process.'
                        )
                    }

                    if (!currentUser)
                        throw new NotFoundException(`User with id: ${id} not found.`)

                    if (
                        dto.version !== undefined &&
                            dto.version !== currentUser.version
                    ) {
                        throw new ConflictException(
                            `Version mismatch. Expected ${currentUser.version}, got ${dto.version}`
                        )
                    }

                    if (dto.email && dto.email !== currentUser.email) {
                        const existinUser = await tx.user.findUnique({
                            where: { email: dto.email },
                            select: { id: true }
                        })

                        if (existinUser && existinUser.id !== id) {
                            throw new ConflictException('Email already exists')
                        }
                    }

                    let data = { ...dto }

                    if (dto.password) {
                        data = {
                            ...dto,
                            password: await bcrypt.hash(dto.password, this.SALT_ROUNDS)
                        }
                    }

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
                    isolationLevel: 'Serializable'
                }
            )
        } catch (error) {
            throw new Error(`Error occured while updateing user data: ${error}`)
        }
    }

    async getUserProfile(id: string) {
        const cacheKey = `user_profile:${id}`
        return await this.prisma.$transaction(async tx => {
            const user = await tx.user.findUnique({
                where: {
                    id: id
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                    version: true,
                    document: {
                        select: {
                            id: true,
                            title: true,
                            fileUrl: true,
                            createdAt: true,
                            updatedAt: true,
                            version: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            })

            if (!user)
                throw new NotFoundException(`User with id: ${id} not found.`)

            const profile: UserProfileDto = {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                version: user.version,
                documentsCount: user.document.length,
                documents: user.document
            }
            await this.redis.setex(cacheKey, 300, JSON.stringify(profile))

            return profile
        })
    }

    //softdelete

    //harddelete
}
