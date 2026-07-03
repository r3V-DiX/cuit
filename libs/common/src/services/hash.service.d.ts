import { ConfigService } from "@nestjs/config";
export declare class HashService {
  private configService;
  private readonly saltRounds;
  constructor(configService: ConfigService);
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  hashToken(token: string): string;
  /**
   * Timing-safe token comparison — prevents timing attacks.
   * Always use this instead of === when comparing tokens/hashes.
   */
  compareToken(token: string, hashedToken: string): boolean;
}
