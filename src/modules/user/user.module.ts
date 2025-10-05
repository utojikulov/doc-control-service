import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Module({
    providers: [
        UserService,
        PrismaService,
        ConfigService,
        RedisService
    ],
    controllers: [UserController],
    exports: [UserService]
})
export class UserModule {}
