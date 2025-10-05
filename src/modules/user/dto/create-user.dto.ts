import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail({}, {
        message: 'Invalid email format'
    })
    email: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain uppercase, lowercase, number and special char',
    })
    password: string
}
