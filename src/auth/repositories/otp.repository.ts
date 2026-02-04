import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Placeholder for future implementation
  async create(data: any) {
    // console.log('Creating OTP', data);
    // return this.prisma.otpCode.create({ data });
  }

  async findValid(phone: string, code: string) {
    // return this.prisma.otpCode.findFirst({ ... });
  }
}
