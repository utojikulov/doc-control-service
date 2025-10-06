import { Expose } from 'class-transformer'

export class DocumentResponseDto {
	@Expose()
	id: string

	@Expose()
	title: string

	@Expose()
	fileName: string

	@Expose()
	fileSize: number

	@Expose()
	mimeType: string

	@Expose()
	fileUrl: string

	@Expose()
	createdAt: Date

	@Expose()
	updatedAt: Date

	@Expose()
	version: number
}
