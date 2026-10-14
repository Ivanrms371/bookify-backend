import { randomInt } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { OTP_CODE_LENGTH } from '../domain/verification-rules';
import type { GeneratedVerificationCode } from '../types/verification.types';

export async function createVerificationCode(): Promise<GeneratedVerificationCode> {
  const code = randomInt(0, 10 ** OTP_CODE_LENGTH)
    .toString()
    .padStart(OTP_CODE_LENGTH, '0');
  return { code, hash: await hash(code, 10) };
}

export async function matchesVerificationCode(code: string, expectedHash: string): Promise<boolean> {
  if (code.length !== OTP_CODE_LENGTH || !/^[0-9]+$/.test(code)) {
    return false;
  }

  return compare(code, expectedHash);
}
