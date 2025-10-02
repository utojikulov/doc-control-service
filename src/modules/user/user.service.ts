import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly redisService: RedisService
    ) {}
}
