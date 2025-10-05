import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth } from 'src/common/decorators/auth.decorator'
import { UpdateUserDto } from './dto/update-user.dto'
import { CurrentUser } from 'src/common/decorators/user.decorator'
import { UserProfileDto } from './dto/user-profile.dto'

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Auth()
	@Get('profile')
	async getProfile(@CurrentUser('id') id: string): Promise<UserProfileDto> {
		return await this.userService.getUserProfile(id)
	}

	@Auth()
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.userService.findOne(id)
	}

	@Auth()
	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return await this.userService.update(id, dto)
	}
}
