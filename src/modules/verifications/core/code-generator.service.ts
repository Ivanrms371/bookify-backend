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
   * Generates a safe token of urls
   */
  generateToken(): string {
    const randomBytes = crypto.randomBytes(32);
    return randomBytes.toString('hex');
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
