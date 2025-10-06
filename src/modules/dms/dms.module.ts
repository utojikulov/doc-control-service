import { Module } from '@nestjs/common'
import { DmsService } from './dms.service'
import { ConfigModule } from '@nestjs/config'

@Module({
	imports: [ConfigModule],
	providers: [DmsService],
	exports: [DmsService]
})
export class DmsModule {}
