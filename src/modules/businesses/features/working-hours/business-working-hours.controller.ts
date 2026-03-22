import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { BusinessWorkingHoursService } from './business-working-hours.service';
import { CreateWorkingHourDto } from 'src/modules/staffs/features/working-hours/dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from 'src/modules/staffs/features/working-hours/dto/update-working-hour.dto';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BusinessGuard } from 'src/common/guards/business.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('businesses/:businessId/working-hours')
export class BusinessWorkingHoursController {
  constructor(private readonly workingHoursService: BusinessWorkingHoursService) {}

  @Get()
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN, BusinessRole.STAFF)
  findAll(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.workingHoursService.findAllByBusiness(businessId);
  }

  @Post()
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  create(@Param('businessId', ParseUUIDPipe) businessId: string, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.create(businessId, body);
  }

  @Post('bulk')
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  bulkUpdate(@Param('businessId', ParseUUIDPipe) businessId: string, @Body() body: UpdateWorkingHoursBulkDto) {
    return this.workingHoursService.bulkUpdate(businessId, body);
  }

  @Put(':workingHourId')
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('workingHourId', ParseUUIDPipe) workingHourId: string,
    @Body() body: UpdateWorkingHourDto,
  ) {
    return this.workingHoursService.update(businessId, workingHourId, body);
  }

  @Delete(':workingHourId')
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  delete(@Param('businessId', ParseUUIDPipe) businessId: string, @Param('workingHourId', ParseUUIDPipe) workingHourId: string) {
    return this.workingHoursService.delete(businessId, workingHourId);
  }
}
