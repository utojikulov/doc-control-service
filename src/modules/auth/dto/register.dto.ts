import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format..'})
    email: string

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 chars'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Passwordmust contain upper and lowercase letters, number and special chars.'
    })
    password: string
}
