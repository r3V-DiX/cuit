// apps/notification-service/src/messaging/gateways/messaging.gateway.ts

import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { MessagingRepository } from '../repositories/messaging.repository';

interface WsPayload {
    sub: string;
    email: string;
    role: string;
    type: string;
    exp: number;
}

@Injectable()
@WebSocketGateway({
    namespace: '/messaging',
    // Client (hooks/useMessaging.ts) requests this exact path whether it connects
    // through the gateway's /ws passthrough or straight to this service in dev —
    // must match on both sides since the gateway does not rewrite the prefix.
    path: '/ws/socket.io',
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [
            'http://localhost:3000',
            'http://localhost:4000',
        ],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e4, // 10 KB max WS frame
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessagingGateway.name);
    private readonly userSockets = new Map<string, Set<string>>(); // userId → socketIds

    constructor(
        private readonly configService: ConfigService,
        private readonly messagingRepository: MessagingRepository,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth?.token as string) ||
                (client.handshake.query?.token as string);

            if (!token) {
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            if (!secret) throw new InternalServerErrorException('JWT_SECRET not configured');
            const payload = jwt.verify(token, secret) as WsPayload;

            if (payload.type !== 'ws') {
                client.disconnect();
                return;
            }

            client.data.userId = payload.sub;
            client.data.role = payload.role;
            client.data.exp = payload.exp;

            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub)!.add(client.id);

            this.logger.debug(`WS connected: ${payload.sub} (${client.id})`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            sockets?.delete(client.id);
            if (sockets?.size === 0) this.userSockets.delete(userId);
            this.logger.debug(`WS disconnected: ${userId} (${client.id})`);
        }
    }

    @SubscribeMessage('join:conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = client.data?.userId;
        if (!userId) throw new WsException('Unauthorized');
        if (!data?.conversationId || typeof data.conversationId !== 'string' || data.conversationId.length > 36) {
            throw new WsException('conversationId required');
        }

        // Verify token not expired (stateless re-check)
        if (client.data.exp && Date.now() / 1000 > client.data.exp) {
            client.disconnect();
            throw new WsException('Token expired');
        }

        // CRITICAL: verify user is a participant in this conversation
        const conv = await this.messagingRepository.findConversationById(
            data.conversationId,
            userId,
        );
        if (!conv) throw new WsException('Forbidden');

        client.join(`conv:${data.conversationId}`);
        return { ok: true };
    }

    @SubscribeMessage('leave:conversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        if (!data?.conversationId || typeof data.conversationId !== 'string') return;
        client.leave(`conv:${data.conversationId}`);
        return { ok: true };
    }

    emitToConversation(conversationId: string, event: string, payload: unknown) {
        this.server.to(`conv:${conversationId}`).emit(event, payload);
    }

    emitToUser(userId: string, event: string, payload: unknown) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            for (const socketId of sockets) {
                this.server.to(socketId).emit(event, payload);
            }
        }
    }
}
