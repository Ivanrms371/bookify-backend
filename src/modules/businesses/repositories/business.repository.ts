import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { CreateBusinessDto } from '../dto/create-business.dto';

@Injectable()
export class BusinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUnique(args: Prisma.BusinessFindUniqueArgs) {
    return this.prisma.business.findUnique(args);
  }

  findFirst(args: Prisma.BusinessFindFirstArgs) {
    return this.prisma.business.findFirst(args);
  }

  create(args: Prisma.BusinessCreateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.business.create(args);
  }

  update(args: Prisma.BusinessUpdateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.business.update(args);
  }

  upsert(args: Prisma.BusinessUpsertArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.business.upsert({
      ...args,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        type: true,
        addressLine1: true,
        addressLine2: true,
        phone: true,
        logoUrl: true,
        coverUrl: true,
        onboardingCompleted: true,
      },
    });
  }
}
