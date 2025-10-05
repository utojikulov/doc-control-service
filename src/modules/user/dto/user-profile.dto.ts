export class DocumentSummaryDto {
	id: string
	title: string
	fileUrl: string
	createdAt: Date
	updatedAt: Date
	version: number
}

export class UserProfileDto {
	id: string
	email: string
	createdAt: Date
	updatedAt: Date
	version: number
	documentsCount: number
	documents: DocumentSummaryDto[]
}
