import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './modules/prisma/prisma.module'
import { RedisModule } from './modules/redis/redis.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import config from './modules/config/config'
import { DmsModule } from './modules/dms/dms.module'
import { DocumentModule } from './modules/document/document.module'
import { WebSocketModule } from './modules/gateway/gateway.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [config],
			envFilePath: '.env'
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		UserModule,
		DmsModule,
		DocumentModule,
		WebSocketModule
	]
})
export class AppModule {}
