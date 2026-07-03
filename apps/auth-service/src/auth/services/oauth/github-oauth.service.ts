// apps/auth-service/src/auth/services/oauth/github-oauth.service.ts
// CHANGES FROM ORIGINAL:
//   + handleCallback accepts userAgent and passes it to findOrCreateUser

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AppLogger } from '@cykruit/logger';
import { OAuthBaseService } from './oauth-base.service';
import { OAuthProvider, OAuthUserData, OAuthTokenResponse } from '../../types/oauth.types';
import { UserRole } from '@prisma/client';

@Injectable()
export class GitHubOAuthService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly oauthBaseService: OAuthBaseService,
        private readonly logger: AppLogger,
    ) {
        this.clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
        this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
        this.redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');
        this.validateConfig();
    }

    async getAuthorizationUrl(role: UserRole, redirectUrl?: string): Promise<{ url: string; state: string }> {
        const state = await this.oauthBaseService.createState(OAuthProvider.GITHUB, role, redirectUrl);

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'user:email read:user',
            state,
            allow_signup: 'true',
        });

        const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
        return { url, state };
    }

    async handleCallback(code: string, state: string, ipAddress?: string, userAgent?: string) {
        const stateData = await this.oauthBaseService.validateAndConsumeState(OAuthProvider.GITHUB, state);
        const accessToken = await this.exchangeCodeForToken(code);
        const userData = await this.fetchUserData(accessToken);
        return await this.oauthBaseService.findOrCreateUser(userData, stateData.role, ipAddress, userAgent);
    }

    private async exchangeCodeForToken(code: string): Promise<string> {
        try {
            const response = await axios.post<OAuthTokenResponse>(
                'https://github.com/login/oauth/access_token',
                { client_id: this.clientId, client_secret: this.clientSecret, code, redirect_uri: this.redirectUri },
                { headers: { Accept: 'application/json' } },
            );

            if (!response.data.access_token) {
                throw new UnauthorizedException('No access token received from GitHub');
            }

            return response.data.access_token;
        } catch (error) {
            this.logger.error('Failed to exchange GitHub code for token', error.stack, 'GitHubOAuthService');
            throw new UnauthorizedException('Failed to authenticate with GitHub');
        }
    }

    private async fetchUserData(accessToken: string): Promise<OAuthUserData> {
        try {
            const headers = {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            };

            const userResponse = await axios.get('https://api.github.com/user', { headers });
            const profile = userResponse.data;

            let email = profile.email;
            if (!email) {
                const emailsResponse = await axios.get('https://api.github.com/user/emails', { headers });
                const primaryEmail = emailsResponse.data.find((e: any) => e.primary && e.verified);
                email = primaryEmail?.email;
            }

            if (!email) throw new UnauthorizedException('No verified email found in GitHub account');

            const fullName = profile.name || profile.login || '';
            const nameParts = fullName.split(' ');

            return {
                providerId: profile.id.toString(),
                email,
                firstName: nameParts[0] || profile.login || '',
                lastName: nameParts.slice(1).join(' ') || '',
                profileImage: profile.avatar_url,
                provider: OAuthProvider.GITHUB,
            };
        } catch (error) {
            this.logger.error('Failed to fetch GitHub user data', error.stack, 'GitHubOAuthService');
            throw new UnauthorizedException('Failed to fetch user data from GitHub');
        }
    }

    private validateConfig(): void {
        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            throw new Error('GitHub OAuth configuration is incomplete');
        }
        this.logger.log('GitHub OAuth configured successfully', 'GitHubOAuthService');
    }
}