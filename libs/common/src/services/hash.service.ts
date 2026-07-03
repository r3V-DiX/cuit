// libs/common/services/hash.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HashService {
    private readonly saltRounds: number;

    constructor(private configService: ConfigService) {
        // ✅ Default raised from 10 → 12 (OWASP minimum recommendation)
        this.saltRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS'), 10) || 12;
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /**
     * Timing-safe token comparison — prevents timing attacks.
     * Always use this instead of === when comparing tokens/hashes.
     */
    compareToken(token: string, hashedToken: string): boolean {
        const a = Buffer.from(this.hashToken(token), 'hex');
        const b = Buffer.from(hashedToken, 'hex');
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    }
}