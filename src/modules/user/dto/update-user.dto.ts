import { IsEmail, IsInt, IsOptional, IsString, Matches, MinLength } from "class-validator"

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password?: string

  @IsOptional()
  @IsInt()
  version?: number
}
