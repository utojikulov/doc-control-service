import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DmsService } from '../dms/dms.service'
import { RedisService } from '../redis/redis.service'
import { CreateDocumentDto } from './dto/create-document.dto'
import { DocumentResponseDto } from './dto/document-response.dto'
import { plainToInstance } from 'class-transformer'
import { QueryDocumentDto } from './dto/query-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

@Injectable()
export class DocumentService {
	private readonly logger = new Logger(DocumentService.name)
	private readonly MAX_RETRY_ATTEMPTS = 3
	private readonly RETRY_DELAY_MS = 100

	constructor(
		private prisma: PrismaService,
		private dmsService: DmsService,
		private redis: RedisService
	) {}

	async createDocument(
		dto: CreateDocumentDto,
		file: Express.Multer.File,
		userId: string
	): Promise<DocumentResponseDto> {
		let s3Key: string | null = null
		try {
			const { key, url } = await this.dmsService.uploadFile(file)
			s3Key = key

			const document = await this.prisma.$transaction(
				async tx => {
					const user = await tx.user.findUnique({
						where: { id: userId },
						select: { id: true, version: true }
					})

					if (!user) {
						throw new NotFoundException('User not found')
					}

					return await tx.document.create({
						data: {
							title: dto.title,
							fileName: file.originalname,
							fileSize: file.size,
							mimeType: file.mimetype,
							s3Key: key,
							fileUrl: url,
							userId,
							version: 0
						}
					})
				},
				{
					isolationLevel: 'Serializable'
				}
			)

			this.logger.log(
				`DOcument created: ${document.id} by user: ${userId}`
			)

			return plainToInstance(DocumentResponseDto, document, {
				excludeExtraneousValues: true
			})
		} catch (error) {
			try {
				await this.dmsService.deleteFile(s3Key!)
				this.logger.warn(
					`Compensated: deleted file ${s3Key} due to DB error`
				)
			} catch (s3Error) {
				this.logger.error(
					`Failed to compensate S3 deletion: ${s3Error.message}`
				)
			}
			this.logger.error(`Error createing document: ${error.message}`)
			throw new InternalServerErrorException('Failed to create document')
		}
	}

	async update(
		id: string,
		dto: UpdateDocumentDto,
		userId: string
	): Promise<DocumentResponseDto> {
		try {
			return await this.prisma.$transaction(
				async tx => {
					const currentDocument = await tx.document.findFirst({
						where: {
							id,
							userId
						}
					})

					if (!currentDocument) {
						throw new NotFoundException('Document not found')
					}

					if (dto.version !== currentDocument.version) {
						throw new ConflictException(
							`Version conflict. Expected ${currentDocument.version}, got ${dto.version}`
						)
					}

					const updatedDocument = await tx.document.update({
						where: {
							id,
							version: currentDocument.version
						},
						data: {
							title: dto.title || currentDocument.title,
							version: { increment: 1 },
							updatedAt: new Date()
						}
					})

					return updatedDocument
				},
				{
					isolationLevel: 'Serializable',
					timeout: 15000,
					maxWait: 5000
				}
			)
		} catch (error) {
			if (
				error instanceof NotFoundException ||
				error instanceof ConflictException
			) {
				throw error
			}

			this.logger.error(`Error updating document ${id}: ${error.message}`)
			throw new InternalServerErrorException('Failed to update document')
		}
	}

	async findAllByUser(
		userId: string,
		query: QueryDocumentDto = {}
	): Promise<{
		documents: DocumentResponseDto[]
		total: number
		page: number
		limit: number
		totalPages: number
	}> {
		try {
			const { search, page = 1, limit = 10 } = query
			const skip = (page - 1) * limit

			const where = {
				userId,
				...(search && {
					OR: [
						{
							title: {
								contains: search,
								mode: 'insensitive' as const
							}
						},
						{
							fileName: {
								contains: search,
								mode: 'insensitive' as const
							}
						}
					]
				})
			}

			const [documents, total] = await Promise.all([
				this.prisma.document.findMany({
					where,
					skip,
					take: limit,
					orderBy: { createdAt: 'desc' }
				}),
				this.prisma.document.count({ where })
			])

			const totalPages = Math.ceil(total / limit)

			return {
				documents: plainToInstance(DocumentResponseDto, documents, {
					excludeExtraneousValues: true
				}),
				total,
				page,
				limit,
				totalPages
			}
		} catch (error) {
			this.logger.error(
				`Error fetching documents for user ${userId}: ${error.message}`
			)
			throw new InternalServerErrorException('Failed to fetch documents')
		}
	}

	async findOne(id: string, userId: string): Promise<DocumentResponseDto> {
		try {
			return await this.prisma.$transaction(
				async tx => {
					const document = await tx.document.findFirst({
						where: { id, userId }
					})

					if (!document)
						throw new NotFoundException('Document not found')

					return plainToInstance(DocumentResponseDto, document, {
						excludeExtraneousValues: true
					})
				},
				{
					isolationLevel: 'ReadCommitted'
				}
			)
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}

			this.logger.error(`Error fetching doc: ${id}: ${error.message}`)
			throw new InternalServerErrorException('Failed to fetch document')
		}
	}
	async getDownloadUrl(id: string, userId: string): Promise<{ url: string }> {
		try {
			const document = await this.prisma.document.findFirst({
				where: { id, userId }
			})

			if (!document) {
				throw new NotFoundException('Document not found')
			}

			return await this.dmsService.getPresignedUrl(document.s3Key)
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			this.logger.error(
				`Error getting download URL for document ${id}: ${error.message}`
			)
			throw new InternalServerErrorException('Failed to get download URL')
		}
	}

	async remove(id: string, userId: string): Promise<{ message: string }> {
		let docToDel
		try {
			docToDel = await this.prisma.$transaction(
				async tx => {
					const document = await tx.document.findFirst({
						where: { id, userId }
					})

					if (!document) {
						throw new NotFoundException('Document not found')
					}

					const deletedDocument = await tx.document.delete({
						where: {
							id,
							version: document.version
						}
					})

					return deletedDocument
				},
				{
					isolationLevel: 'Serializable'
				}
			)

			try {
				await this.dmsService.deleteFile(docToDel.s3Key)
			} catch (s3) {
				this.logger.warn(
					`S3 deletion faild fro ${docToDel.s3Key}: ${s3.message}`
				)
			}

			this.logger.log(`Document deleted: ${id} by user: ${userId}`)

			return { message: 'Document deleted successfully' }
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}

			if (error.code === 'P2025') {
				throw new ConflictException(
					'Document was modified by another operation'
				)
			}

			this.logger.error(`Error deleting document ${id}: ${error.message}`)
			throw new InternalServerErrorException('Failed to delete document')
		}
	}

	// private async retryOnConficlt<T>(
	// 	operation: () => Promise<T>,
	// 	attemts: number = this.MAX_RETRY_ATTEMPTS
	// ): Promise<T> {
	// 	for (let i = 0; i < attemts; i++) {
	// 		try {
	// 			return await operation()
	// 		} catch (error) {
	// 			throw new Error(error)
	// 		}
	// 	}
	// 	throw new ConflictException('Max retry attemts exceeded')
	// }
}
