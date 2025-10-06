import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class DmsService {
	private readonly logger = new Logger(DmsService.name)
	private client: S3Client
	private bucketName: string

	constructor(private readonly config: ConfigService) {
		this.bucketName = this.config.get<string>('s3.bucket_name')!

		this.client = new S3Client({
			region: this.config.get<string>('s3.region')!,
			credentials: {
				accessKeyId: this.config.get<string>('s3.access_key')!,
				secretAccessKey: this.config.get<string>(
					's3.secret_access_key'
				)!
			},
			forcePathStyle: true
		})
	}
	async uploadFile(
		file: Express.Multer.File
	): Promise<{ key: string; url: string }> {
		try {
			const key = `${uuidv4()}`
			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype,
				Metadata: {
					originalName: file.originalname,
					uploadedAt: new Date().toISOString()
				}
			})

			await this.client.send(command)

			return { key, url: (await this.getFileUrl(key)).url }
		} catch (error) {
			this.logger.error(`Error uploading file: ${error.message}`)
			throw new BadRequestException('Failed to upload file to S#')
		}
	}

	async getFileUrl(key: string) {
		return {
			url: `https://${this.bucketName}.s3.${this.config.get<string>('s3.region')}.amazonaws.com/${key}`
		}
	}

	async getPresignedUrl(key: string) {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: key
			})

			const url = await getSignedUrl(this.client, command, {
				expiresIn: 60 * 60 * 24
			})

			return { url }
		} catch (error) {
			this.logger.error(
				`Error generating pre-signed URL: ${error.message}`
			)
			throw new InternalServerErrorException(error)
		}
	}

	async deleteFile(key: string) {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key: key
			})

			await this.client.send(command)
			this.logger.log(`File deleted successfully: ${key}`)
			return { message: 'File deleted successfully' }
		} catch (error) {
			this.logger.error(`Error deleting file: ${error.message}`)
			throw new BadRequestException('Failed to delete file from S3')
		}
	}
}
