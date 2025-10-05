import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

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
        })

        this.redisClient.on('error', error => {
            this.logger.error('Redis error:', error)
        })
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.redisClient.get(key)
        } catch (error) {
            this.logger.error(`Error gettting key: ${key}:`, error)
            return null
        }
    }

    async set(key: string, value: string | number): Promise<'OK' | null> {
        try {
            return await this.redisClient.set(key, value)
        } catch (error) {
            this.logger.error(`Error setting key ${key}:`, error)
            return null
        }
    }

    async del(...keys: string[]): Promise<number> {
        try {
            if (keys.length === 0) return 0
            return await this.redisClient.del(...keys)
        } catch (error) {
            this.logger.error(`errror deleting keys`, error)
            return 0
        }
    }

    async hset(key: string, field: string, value: string): Promise<number> {
        try {
            return await this.redisClient.hset(key, field, value)
        } catch (error) {
            this.logger.error(`Error setting hash field ${key}:${field}:`, error)
            return 0
        }
    }

    async hget(key: string, field: string): Promise<string | null> {
        try {
            return await this.redisClient.hget(key, field)
        } catch (error) {
            this.logger.error(`Error getting hash field ${key}:${field}:`, error)
            return null
        }
    }

    async hdel(key: string, ...fields: string[]): Promise<number> {
        try {
            return await this.redisClient.hdel(key, ...fields)
        } catch (error) {
            this.logger.error(`Error deleting hash fields ${key}:`, error)
            return 0
        }
    }

    async setex(
        key: string,
        seconds: number,
        value: string | number
    ): Promise<'OK' | null> {
        try {
            return await this.redisClient.setex(key, seconds, value)
        } catch (error) {
            this.logger.error(` Error setting key ${key} with expiration:`, error)
            return null
        }
    }
}
