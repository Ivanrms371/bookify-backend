import { Controller, Get, Param, Patch, Body, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard)
@Controller('tenant/:tenantId')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('')
  async getTenant(@Req() req: AuthenticatedRequest, @Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    const userId = req.user.userId;
    return this.tenantsService.findTenantByIdAndValidate(userId, tenantId);
  }

  @Patch('')
  @UseGuards(TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  async updateTenantPublicStatus(@Param('tenantId', new ParseUUIDPipe()) tenantId: string, @Body('isPublic') isPublic: boolean) {
    return this.tenantsService.updateTenantStatus(tenantId, isPublic);
  }
}
