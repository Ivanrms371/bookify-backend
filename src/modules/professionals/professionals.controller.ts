import { Controller, Get, Query, Req, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest, @GetTenantId() tenantId: string, @Query() query: GetProfessionalsQueryDto) {
    return this.professionalsService.findAll(tenantId, query);
  }

  @Get(':id')
  async findById(@Req() req: AuthenticatedRequest, @GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.professionalsService.findById(tenantId, id);
  }

  @Get(':id/details')
  async getDetails(@Req() req: AuthenticatedRequest, @GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.professionalsService.getByIdWithDetails(tenantId, id);
  }


  @Put(':id')
  async update(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionalsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async delete(@Req() req: AuthenticatedRequest, @GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.professionalsService.delete(tenantId, id);
  }

  @Post(':id/services/:serviceId')
  async addService(
    @Req() req: AuthenticatedRequest,
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.professionalsService.addService({ professionalId: id, serviceId, tenantId });
  }

  @Delete(':id/services/:serviceId')
  async deleteService(
    @Req() req: AuthenticatedRequest,
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.professionalsService.removeService({ professionalId: id, serviceId, tenantId });
  }
}
