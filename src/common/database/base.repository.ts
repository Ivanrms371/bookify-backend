import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

export type DbClient = PrismaService | Prisma.TransactionClient;

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  protected db(client?: DbClient) {
    return client ?? this.prisma;
  }
}
