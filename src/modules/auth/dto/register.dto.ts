import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format..'})
    email: string

    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 chars.'})
    @MaxLength(20, { message: 'Username must not exceed 20 chars.'})
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers and underscores'
    })
    username: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 chars'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Passwordmust contain upper and lowercase letters, number and special chars.'
    })
    password: string
}
