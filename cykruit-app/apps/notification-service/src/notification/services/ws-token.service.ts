// apps/notification-service/src/notification/services/ws-token.service.ts

import { Injectable } from '@nestjs/common';
import { TokenService } from '@cykruit/common';
import type { User } from '@prisma/client';

@Injectable()
export class WsTokenService {
    constructor(private readonly tokenService: TokenService) {}

    /**
     * Issue a short-lived (5 min) JWT for the WebSocket handshake.
     * The client sends it once during the WS upgrade — the WS gateway verifies it.
     */
    issueToken(user: User): { token: string; expiresIn: number } {
        const token = this.tokenService.createWsToken(
            user.id,
            user.email,
            user.role,
        );
        return { token, expiresIn: 300 }; // 5 minutes in seconds
    }
}
