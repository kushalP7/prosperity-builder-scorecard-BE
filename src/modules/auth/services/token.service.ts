import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptJWT, jwtDecrypt, JWTPayload } from 'jose';
import { getErrorMessage } from '../../../common/errors';

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
    this.encryptionKey = crypto.createHash('sha256').update(rawSecret).digest();
    this.accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION');
    this.refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
  }

  async generateAccessToken(payload: Omit<AuthTokenPayload, 'tokenType'>): Promise<string> {
    return new EncryptJWT({ ...payload, tokenType: 'access' })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(this.accessExpiration)
      .encrypt(this.encryptionKey);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return new EncryptJWT({ sub: userId, tokenType: 'refresh' })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(this.refreshExpiration)
      .encrypt(this.encryptionKey);
  }

  async verifyToken<T extends JWTPayload = AuthTokenPayload>(token: string): Promise<T> {
    try {
      const { payload } = await jwtDecrypt(token, this.encryptionKey);
      return payload as T;
    } catch (err: unknown) {
      this.logger.warn(`Token verification failed: ${getErrorMessage(err)}`);
      throw err;
    }
  }
}
