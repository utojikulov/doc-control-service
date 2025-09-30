import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name)
    private readonly redisClient: Redis

    constructor(private readonly configService: ConfigService) {
        this.redisClient = new Redis({
            password: this.configService.get<string>('cache.redis_password')!,
            port: this.configService.get<number>('cache.redis_port')!,
            host: this.configService.get<string>('cache.redis_host')!
        })
        this.redisClient.on('connect', () => {
            this.logger.log('Connection to REDIS was successful.')
        });

        this.redisClient.on('error', (error) => {
            this.logger.error('Redis error:', error)
        });
    }
}
