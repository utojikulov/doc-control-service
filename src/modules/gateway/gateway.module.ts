import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DocumentGateway } from './document.gateway'

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('jwt.secret'),
				signOptions: {
					expiresIn: config.get<string>('jwt.expires_in'),
					algorithm: 'HS256'
				}
			})
		})
	],
	providers: [DocumentGateway],
	exports: [DocumentGateway]
})
export class WebSocketModule {}
