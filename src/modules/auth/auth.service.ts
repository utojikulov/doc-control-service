import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { RegisterDto } from './dto/register.dto'
import { UserService } from '../user/user.service'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { Response } from 'express'

@Injectable()
export class AuthService {
    // private readonly JWT_EXPIRES_IN
    private readonly REFRESH_EXPIRES_IN = 1
    REFRESH_TOKEN_NAME = 'refreshToken'

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly config: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService
    ) {
        // this.JWT_EXPIRES_IN = this.config.get('jwt.expires_in')!
        // this.REFRESH_EXPIRES_IN = this.config.get('jwt.refresh_expires_in')!
    }

    async register(dto: RegisterDto) {
        try {
            return await this.prisma.$transaction(async tx => {
                const existingUser = await tx.user.findUnique({
                    where: { email: dto.email },
                    select: { id: true }
                })

                if (existingUser)
                    throw new ConflictException(
                        'User with this email already exists.'
                    )

                const user = await this.userService.createUser(dto)
                const tokens = this.generateTokens(user.id)

                return {
                    user,
                    ...tokens
                }
            })
        } catch (error) {
            console.error(error)
            throw new ConflictException('Error occured while registering a user.')
        }
    }

    async login(dto: LoginDto) {
        const user = await this.validateUser(dto)
        const tokens = this.generateTokens(user.id)

        return {
            user,
            ...tokens
        }
    }

    async logout(refreshToken: string) {
        try {
            const result = await this.jwtService.verifyAsync(refreshToken)

            if (result && result.sub && result.exp) {
                const ttl = result.exp - Math.floor(Date.now() / 1000)
                if (ttl > 0) {
                    await this.redis.setex(`blacklist_${refreshToken}`, ttl, 'true')
                }
            }
            return {
                message: 'Logged out successfully'
            }
        } catch (error) {
            return {
                message: 'Logged out successfully'
            }
        }
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        const result = await this.redis.get(`blacklist_${token}`)
        return result === 'true'
    }

    async getNewToken(refreshToken: string) {
        try {
            const isBlacklisted = await this.isTokenBlacklisted(refreshToken)
            if (isBlacklisted) {
                throw new UnauthorizedException('Token has been revoked')
            }

            const result = await this.jwtService.verifyAsync(refreshToken)
            if (!result) throw new UnauthorizedException('Invalid refresh token.')

            if (!result.sub) {
                throw new UnauthorizedException('Invalid token payload.')
            }

            const user = await this.userService.findOne(result.sub)
            const tokens = this.generateTokens(user.id)

            return {
                user,
                ...tokens
            }
        } catch (error) {
            if (
                error.name === 'JsonWebTokenError' ||
                    error.name === 'TokenExpiredError'
            ) {
                throw new UnauthorizedException('Invalid or expired refresh token.')
            }
            throw error
        }
    }

    private generateTokens(userId: string) {
        const payload = { sub: userId }

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '3h'
        })

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '3d'
        })

        return { accessToken, refreshToken }
    }

    private async validateUser(dto: RegisterDto) {
        const user = await this.userService.getByEmail(dto.email)

        if (!user) throw new NotFoundException('User not found.')

        const isValid = await bcrypt.compare(dto.password, user.password)

        if (!isValid) throw new UnauthorizedException('Invalid password.')

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    addRefreshTokenToResponse(res: Response, refreshToken: string) {
        const expiresIn = new Date()
        expiresIn.setDate(expiresIn.getDate() + this.REFRESH_EXPIRES_IN)

        res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            expires: expiresIn,
            secure: false,
            sameSite: 'lax'
        })
    }

    removeRefreshTokenFromResponse(res: Response) {
        res.cookie(this.REFRESH_TOKEN_NAME, '', {
            httpOnly: true,
            expires: new Date(0),
            secure: false,
            sameSite: 'lax'
        })
    }
}
