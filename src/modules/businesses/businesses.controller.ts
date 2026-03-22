import { Controller, Get, Param, Patch, Body, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { BusinessGuard } from 'src/common/guards/business.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard)
@Controller('business/:businessId')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('')
  async getBusiness(@Req() req: AuthenticatedRequest, @Param('businessId', new ParseUUIDPipe()) businessId: string) {
    const userId = req.user.userId;
    return this.businessesService.findBusinessByIdAndValidate(userId, businessId);
  }

  @Patch('')
  @UseGuards(BusinessGuard)
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  async updateBusinessPublicStatus(@Param('businessId', new ParseUUIDPipe()) businessId: string, @Body('isPublic') isPublic: boolean) {
    return this.businessesService.updateBusinessStatus(businessId, isPublic);
  }
}
