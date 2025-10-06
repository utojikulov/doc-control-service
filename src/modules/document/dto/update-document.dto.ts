import { IsOptional, IsString, MaxLength, IsInt } from 'class-validator'

export class UpdateDocumentDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	title?: string

	@IsInt()
	version: number
}
