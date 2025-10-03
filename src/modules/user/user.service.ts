import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'

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
}
