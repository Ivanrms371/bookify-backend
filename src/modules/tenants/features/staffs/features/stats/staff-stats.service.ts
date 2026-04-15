import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class StaffStatsService {
  constructor(private readonly prisma: PrismaService) {}
}
