import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    providers: [RedisService],
    imports: [ConfigModule]
})
export class RedisModule {}
