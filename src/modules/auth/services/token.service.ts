import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptJWT, jwtDecrypt, JWTPayload } from 'jose';

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  department?: string;
  tokenType?: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly encryptionKey: Uint8Array;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor(private readonly configService: ConfigService) {
    const rawSecret = this.configService.get<string>('JWT_SECRET');
    // Derive exactly 256-bit (32 bytes) key for AES-256-GCM encryption
    this.encryptionKey = crypto.createHash('sha256').update(rawSecret).digest();
    this.accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION');
    this.refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
  }

  /**
   * Generates an encrypted JSON Web Token (JWE A256GCM) with short-lived expiration.
   */
  async generateAccessToken(payload: Omit<AuthTokenPayload, 'tokenType'>): Promise<string> {
    return new EncryptJWT({ ...payload, tokenType: 'access' })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(this.accessExpiration)
      .encrypt(this.encryptionKey);
  }

  /**
   * Generates an encrypted refresh token (JWE A256GCM) for renewing access.
   */
  async generateRefreshToken(userId: string): Promise<string> {
    return new EncryptJWT({ sub: userId, tokenType: 'refresh' })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(this.refreshExpiration)
      .encrypt(this.encryptionKey);
  }

  /**
   * Decrypts and verifies an encrypted JSON Web Token.
   */
  async verifyToken<T extends JWTPayload = AuthTokenPayload>(token: string): Promise<T> {
    try {
      const { payload } = await jwtDecrypt(token, this.encryptionKey);
      return payload as T;
    } catch (err: any) {
      this.logger.warn(`Token verification failed: ${err.message}`);
      throw err;
    }
  }
}
