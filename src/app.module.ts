import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
})
export class AppModule {}
