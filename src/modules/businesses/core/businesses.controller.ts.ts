import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { BusinessGuard } from 'src/common/guards/business.guard';
import { BusinessesService } from '../businesses.service';

@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('/me')
  async getMyBusiness(@Req() req: AuthenticatedRequest) {
    const { businessId } = req.params;
    return this.businessesService.findBusinessById(businessId);
  }
}
