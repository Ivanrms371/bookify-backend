import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { WorkingHoursService } from './working-hours.service';
import { TenantProfessionalParamsDto, TenantProfessionalWorkingHoursParamsDto } from './dto/working-hours.params.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('professionals/:professionalId/working-hours')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}
  @Get()
  findAll(@Param() params: TenantProfessionalParamsDto) {
    return this.workingHoursService.findAll(params);
  }

  @Post()
  create(@Param() params: TenantProfessionalParamsDto, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.create(params, body);
  }

  @Put(':id')
  update(@Param() params: TenantProfessionalWorkingHoursParamsDto, @Body() body: UpdateWorkingHourDto) {
    return this.workingHoursService.update(params, body);
  }

  @Delete(':id')
  delete(@Param() params: TenantProfessionalWorkingHoursParamsDto) {
    return this.workingHoursService.delete(params);
  }
}
