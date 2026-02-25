import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CodeGeneratorService {
  /**
   * Generates a random numeric code of 6 digits.
   */
  generateNumericCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate token and token hash to save on db
   */
  generateTokenAndHash(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  /**
   * Generate hash to compare
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Code hash to save on DB
   */
  generateCodeHash(code: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(code, salt);
  }

  /**
   * Verify code against hash
   */
  verifyCodeHash(code: string, hash: string): boolean {
    return bcrypt.compareSync(code, hash);
  }
}
