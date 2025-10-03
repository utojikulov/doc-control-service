import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
    private readonly JWT_EXPIRES_IN: string
    // private readonly REFRESH_EXPIRES_IN: string

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly config: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService
    ) {
        this.JWT_EXPIRES_IN = this.config.get<string>('jwt.expires_in')!
        // this.REFRESH_EXPIRES_IN = this.config.get('jwt.refresh_expires_in')
    }

    async register(
        dto: RegisterDto,
    ) {
        try {
            const oldUser = await this.userService.getByEmail(dto.email)
            if (oldUser) throw new BadRequestException('User already exists.')
        } catch (error) {
            throw new ConflictException('Error occured while registering a user.' , error)
        }
    }

}
