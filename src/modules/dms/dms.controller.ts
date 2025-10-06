import {
	Body,
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common'
import { DmsService } from './dms.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Auth } from 'src/common/decorators/auth.decorator'

@Controller('dms')
export class DmsController {
	constructor(private readonly dmsService: DmsService) {}

	@Post('file')
	@UseInterceptors(FileInterceptor('file'))
	@Auth()
	async uploadFile(
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
					new MaxFileSizeValidator({
						maxSize: 100000,
						message: 'File is too large. Max file size is 10MB'
					})
				],
				fileIsRequired: true
			})
		)
		file: Express.Multer.File
	) {
		return this.dmsService.uploadFile(file)
	}

	@Get(':key')
	@Auth()
	async getFileUrl(@Param('key') key: string) {
		return this.dmsService.getFileUrl(key)
	}

	@Get('/signed-url/:key')
	@Auth()
	async getSignedUrl(@Param('key') key: string) {
		return this.dmsService.getPresignedUrl(key)
	}

	@Delete(':key')
	@Auth()
	async deleteFile(@Param('key') key: string) {
		return this.dmsService.deleteFile(key)
	}
}
