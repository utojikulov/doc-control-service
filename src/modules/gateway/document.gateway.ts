import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

interface AuthenticatedSocket extends Socket {
	userId?: string
}

@WebSocketGateway({
	cors: {
		origin: '*',
		mehods: ['GET', 'POST'],
		credentials: true
	},
	namespace: '/documents'
})
export class DocumentGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server

	private readonly logger = new Logger(DocumentGateway.name)

	constructor(private readonly jwtService: JwtService) {}

	async handleConnection(client: AuthenticatedSocket) {
		try {
			this.logger.log(`Client attempting connection: ${client.id}`)

			const token =
				client.handshake.auth?.token ||
				client.handshake.headers?.authorization?.replace(
					'Bearer ',
					''
				) ||
				client.handshake.query?.token

			if (!token) {
				this.logger.warn(`No token provided for client: ${client.id}`)
				client.emit('error', {
					message: 'No authentication token provided'
				})
				client.disconnect(true)
				return
			}

			const payload = await this.jwtService.verifyAsync(token)

			if (!payload || !payload.sub) {
				this.logger.warn(`Invalid token for client: ${client.id}`)
				client.emit('error', {
					message: 'Invalid authentication token'
				})
				client.disconnect(true)
				return
			}

			client.userId = payload.sub

			await client.join(`user_${payload.sub}`)

			this.logger.log(
				`Client connected: ${client.id}, User: ${payload.sub}`
			)

			client.emit('connected', {
				message: 'Successfully connected to documents WebSocket',
				userId: payload.sub,
				timestamp: new Date().toISOString()
			})
		} catch (error) {
			this.logger.error(
				`Authentication failed for client ${client.id}: ${error.message}`
			)
			client.emit('error', { message: 'Authentication failed' })
			client.disconnect(true)
		}
	}

	handleDisconnect(client: AuthenticatedSocket) {
		this.logger.log(
			`Client disconnected: ${client.id}, User: ${client.userId || 'unknown'}`
		)
	}

	notifyDocumentCreated(userId: string, document: any) {
		this.server.to(`user_${userId}`).emit('documentCreated', {
			type: 'DOCUMENT_CREATED',
			data: document,
			timestamp: new Date().toISOString()
		})

		this.logger.log(`Sent documentCreated notification to user: ${userId}`)
	}

	notifyDocumentUpdated(userId: string, document: any) {
		this.server.to(`user_${userId}`).emit('documentUpdated', {
			type: 'DOCUMENT_UPDATED',
			data: document,
			timestamp: new Date().toISOString()
		})

		this.logger.log(`Sent documentUpdated notification to user: ${userId}`)
	}

	notifyDocumentDeleted(userId: string, documentId: string) {
		this.server.to(`user_${userId}`).emit('documentDeleted', {
			type: 'DOCUMENT_DELETED',
			data: { id: documentId },
			timestamp: new Date().toISOString()
		})

		this.logger.log(`Sent documentDeleted notification to user: ${userId}`)
	}
}
