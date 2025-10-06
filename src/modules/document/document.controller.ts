import {
	Body,
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Patch,
	Post,
	Query,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common'
import { DocumentService } from './document.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Auth } from 'src/common/decorators/auth.decorator'
import { CurrentUser } from 'src/common/decorators/user.decorator'
import { CreateDocumentDto } from './dto/create-document.dto'
import { QueryDocumentDto } from './dto/query-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'

@Controller('document')
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Post()
	@UseInterceptors(FileInterceptor('file'))
	@Auth()
	async create(
		@Body() dto: CreateDocumentDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
					new MaxFileSizeValidator({
						maxSize: 20 * 1024 * 1024,
						message: 'File is too large'
					})
				],
				fileIsRequired: true
			})
		)
		file: Express.Multer.File,
		@CurrentUser('id') userId: string
	) {
		return this.documentService.createDocument(dto, file, userId)
	}

	@Get()
	@Auth()
	async findAll(
		@CurrentUser('id') userId: string,
		@Query() query: QueryDocumentDto
	) {
		return this.documentService.findAllByUser(userId, query)
	}

	@Get(':id')
	@Auth()
	async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.documentService.findOne(id, userId)
	}

	@Patch(':id')
	@Auth()
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateDocumentDto,
		@CurrentUser('id') userId: string
	) {
		return this.documentService.update(id, dto, userId)
	}

	@Delete(':id')
	@Auth()
	async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.documentService.remove(id, userId)
	}

	@Get('download/:id')
	@Auth()
	async downloadDocument(
		@Param('id') id: string,
		@CurrentUser('id') userId: string
	) {
		return this.documentService.getDownloadUrl(id, userId)
	}
}
