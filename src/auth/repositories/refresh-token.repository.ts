import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenDto) {
    console.log('creating', data);
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findTokenByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({ where: { jti } });
  }

  async revoke(tokenId: string) {
    return this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
