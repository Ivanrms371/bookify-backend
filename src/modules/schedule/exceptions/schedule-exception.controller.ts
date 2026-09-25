import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { ParseUUIDv7Pipe } from 'src/common/pipes/validate-uuidv7.pipe';
import { ScheduleExceptionService } from './schedule-exception.service';
import { CreateScheduleExceptionDto } from '../dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from '../dto/update-schedule-exception.dto';

@Controller('schedule/exceptions')
export class ScheduleExceptionController {
  constructor(private readonly scheduleExceptionService: ScheduleExceptionService) {}

  @Permissions(PERMISSIONS.SCHEDULE_READ)
  @Get()
  findAll(@GetTenantId() tenantId: string) {
    return this.scheduleExceptionService.findAll(tenantId);
  }

  @Permissions(PERMISSIONS.SCHEDULE_READ)
  @Get(':id')
  findById(@Param('id', ParseUUIDv7Pipe) id: string, @GetTenantId() tenantId: string) {
    return this.scheduleExceptionService.findById(tenantId, id);
  }

  @Permissions(PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE)
  @Post()
  create(@GetTenantId() tenantId: string, @Body() dto: CreateScheduleExceptionDto) {
    return this.scheduleExceptionService.create(tenantId, dto);
  }

  @Permissions(PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE)
  @Put(':id')
  update(@Param('id', ParseUUIDv7Pipe) id: string, @GetTenantId() tenantId: string, @Body() dto: UpdateScheduleExceptionDto) {
    return this.scheduleExceptionService.update(tenantId, id, dto);
  }

  @Permissions(PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE)
  @Delete(':id')
  delete(@Param('id', ParseUUIDv7Pipe) id: string, @GetTenantId() tenantId: string) {
    return this.scheduleExceptionService.delete(tenantId, id);
  }
}
