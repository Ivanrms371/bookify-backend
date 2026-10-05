import { Controller, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { CurrentTenant, GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import type { AuthenticatedUser, TenantContext } from 'src/common/security/types/authenticated-request.type';
import { TeamService } from './team.service';

// Keep the existing endpoint while sharing Team's membership/invitation transaction.
@Controller('professionals')
export class ProfessionalDeletionController {
  constructor(private readonly teamService: TeamService) {}

  @Permissions(PERMISSIONS.PROFESSIONAL_DELETE)
  @Delete(':id')
  async delete(
    @GetTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.teamService.deleteProfessional(tenantId, id, { id: user.id, role: tenant.role });
  }
}
