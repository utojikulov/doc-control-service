import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'

export class QueryDocumentDto {
	@IsOptional()
	@IsString()
	search?: string

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	@Min(1)
	page?: number = 1

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10
}
