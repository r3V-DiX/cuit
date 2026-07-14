// apps/auth-service/src/auth/services/oauth/google-oauth.service.ts
// CHANGES FROM ORIGINAL:
//   + handleCallback accepts userAgent and passes it to findOrCreateUser

import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { AppLogger } from "@cykruit/logger";
import { OAuthBaseService } from "./oauth-base.service";
import {
  OAuthProvider,
  OAuthUserData,
  OAuthTokenResponse,
} from "../../types/oauth.types";
import { UserRole } from "@prisma/client";

@Injectable()
export class GoogleOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly oauth2Client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthBaseService: OAuthBaseService,
    private readonly logger: AppLogger,
  ) {
    this.clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    this.clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");
    this.redirectUri = this.configService.get<string>("GOOGLE_REDIRECT_URI");

    this.oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    this.validateConfig();
  }

  async getAuthorizationUrl(
    role: UserRole,
    redirectUrl?: string,
  ): Promise<{ url: string; state: string }> {
    try {
      const state = await this.oauthBaseService.createState(
        OAuthProvider.GOOGLE,
        role,
        redirectUrl,
      );
      const url = this.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ],
        state,
        prompt: "select_account",
      });
      return { url, state };
    } catch (error) {
      this.logger.error(
        "Failed to generate Google OAuth URL",
        error.stack,
        "GoogleOAuthService",
      );
      throw new InternalServerErrorException({
        code: "OAUTH_INIT_FAILED",
        message: "Failed to initialize Google authentication.",
      });
    }
  }

  async handleCallback(
    code: string,
    state: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const stateData = await this.oauthBaseService.validateAndConsumeState(
      OAuthProvider.GOOGLE,
      state,
    );
    const tokens = await this.exchangeCodeForTokens(code);
    const userData = await this.verifyIdToken(tokens.id_token);
    return await this.oauthBaseService.findOrCreateUser(
      userData,
      stateData.role,
      ipAddress,
      userAgent,
    );
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<OAuthTokenResponse> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      if (!tokens.id_token) {
        throw new UnauthorizedException({
          code: "GOOGLE_TOKEN_INVALID",
          message: "Invalid response from Google.",
        });
      }
      return tokens as OAuthTokenResponse;
    } catch (error) {
      this.logger.error(
        "Failed to exchange Google code for tokens",
        error.stack,
        "GoogleOAuthService",
      );
      if (error?.response?.code === "GOOGLE_TOKEN_INVALID") throw error;
      throw new UnauthorizedException({
        code: "OAUTH_TOKEN_EXCHANGE_FAILED",
        message: "Failed to authenticate with Google.",
      });
    }
  }

  private async verifyIdToken(idToken: string): Promise<OAuthUserData> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException({
          code: "GOOGLE_ID_TOKEN_INVALID",
          message: "Invalid Google ID token.",
        });
      }

      const fullName = payload.name || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || payload.given_name || "";
      const lastName =
        nameParts.slice(1).join(" ") || payload.family_name || "";

      return {
        providerId: payload.sub,
        email: payload.email,
        firstName,
        lastName,
        profileImage: payload.picture,
        provider: OAuthProvider.GOOGLE,
      };
    } catch (error) {
      this.logger.error(
        "Failed to verify Google ID token",
        error.stack,
        "GoogleOAuthService",
      );
      throw new UnauthorizedException({
        code: "GOOGLE_ID_TOKEN_INVALID",
        message: "Failed to verify Google ID token.",
      });
    }
  }

  private validateConfig(): void {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new InternalServerErrorException("Google OAuth configuration is incomplete");
    }
    this.logger.log(
      "Google OAuth configured successfully",
      "GoogleOAuthService",
    );
  }
}
