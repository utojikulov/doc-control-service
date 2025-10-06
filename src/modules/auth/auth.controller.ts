import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Request, Response } from 'express'
import { Auth } from 'src/common/decorators/auth.decorator'
import { CurrentUser } from 'src/common/decorators/user.decorator'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Get('verify')
	@Auth()
	async verifyToken(@CurrentUser() user: any) {
		return {
			valid: true,
			user: {
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			}
		}
	}

	@UsePipes(new ValidationPipe())
	@Post('login')
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response
	) {
		const { refreshToken, ...response } = await this.authService.login(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@UsePipes(new ValidationPipe())
	@Post('register')
	async register(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response
	) {
		const { refreshToken, ...response } =
			await this.authService.register(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@Post('logout')
	async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const refreshTokenFromCookies =
			req.cookies[this.authService.REFRESH_TOKEN_NAME]

		this.authService.removeRefreshTokenFromResponse(res)

		if (refreshTokenFromCookies) {
			return await this.authService.logout(refreshTokenFromCookies)
		}

		return { message: 'Logged out successfully' }
	}

	@Post('login/access-token')
	async getNewTokens(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const refreshTokenFromCookies =
			req.cookies[this.authService.REFRESH_TOKEN_NAME]

		if (!refreshTokenFromCookies) {
			this.authService.removeRefreshTokenFromResponse(res)
			throw new UnauthorizedException('Refresh token not passed.')
		}

		const response = await this.authService.getNewToken(
			refreshTokenFromCookies
		)

		this.authService.addRefreshTokenToResponse(res, response.refreshToken)

		return response
	}
}
