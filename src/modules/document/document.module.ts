import { Module } from '@nestjs/common'
import { DocumentService } from './document.service'
import { DocumentController } from './document.controller'
import { DmsModule } from '../dms/dms.module'
import { RedisModule } from '../redis/redis.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
	imports: [DmsModule, RedisModule, PrismaModule],
	providers: [DocumentService],
	controllers: [DocumentController]
})
export class DocumentModule {}
