import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { UserService } from 'src/modules/users/services/user.service';
import { BusinessRepository } from '../repositories/business.repository';
import { CreateBasicBusinessDto } from '../dto/create-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly userService: UserService,
  ) {}

  async findBusinessById(id: string) {
    const business = await this.businessRepository.findUnique({
      where: {
        id,
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async findByOwnerId(ownerId: string) {
    const business = await this.businessRepository.findUnique({
      where: {
        ownerId,
      },
    });

    return business;
  }

  async findByIdAndOwnerId(id: string, ownerId: string) {
    const business = await this.businessRepository.findUnique({
      where: {
        id,
        ownerId,
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async createBusiness(data: CreateBasicBusinessDto, tx?: Prisma.TransactionClient) {
    const business = await this.businessRepository.create(
      {
        data: {
          name: data.name,
          ownerId: data.userId,
          phone: data.phone,
        },
      },
      tx,
    );

    return business;
  }
}
