import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('availability/professionals')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':professionalId')
  async getProfessionalAvailability(
    @GetTenantId() tenantId: string,
    @Param('professionalId') professionalId: string,
    @Query() query: GetSlotsQueryDto,
  ) {
    return this.availabilityService.getProfessionalAvailability(tenantId, professionalId, query);
  }
}
