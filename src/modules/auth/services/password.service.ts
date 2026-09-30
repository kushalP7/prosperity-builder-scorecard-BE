import { Injectable } from '@nestjs/common';
import { argon2id } from 'hash-wasm';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService {
  /**
   * Hashes a password using high-entropy Argon2id with 64MB memory and 16-byte random salt.
   */
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    return argon2id({
      password,
      salt,
      iterations: 3,
      memorySize: 65536, // 64 MB
      parallelism: 1,
      hashLength: 32,
      outputType: 'encoded',
    });
  }

  /**
   * Verifies a plain text password against an Argon2id modular crypt format string.
   */
  async verify(password: string, encodedHash: string): Promise<boolean> {
    try {
      if (!encodedHash || !password) return false;
      const parts = encodedHash.split('$');
      if (parts.length < 6) return false;

      // parts[3] format: 'm=65536,t=3,p=1'
      const params: Record<string, number> = {};
      parts[3].split(',').forEach((kv) => {
        const [k, v] = kv.split('=');
        params[k] = parseInt(v, 10);
      });

      const salt = Buffer.from(parts[4], 'base64');
      const computedHash = await argon2id({
        password,
        salt,
        iterations: params.t || 3,
        memorySize: params.m || 65536,
        parallelism: params.p || 1,
        hashLength: 32,
        outputType: 'encoded',
      });

      return computedHash === encodedHash;
    } catch {
      return false;
    }
  }
}
