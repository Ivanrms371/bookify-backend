import { Controller, Get, Param, Post, Body, Put, Patch, UseGuards, Delete } from '@nestjs/common';
import { ServiceAssignmentsService } from './service-assignments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';
import { BusinessStaffParamsDto } from './dto/params/business-staff.params.dto';
import { BusinessStaffServiceParamsDto } from './dto/params/business-staff-service.params.dto';
import { UpdateServiceAssigmentDto } from './dto/body/update-service-assignment.dto';
import { BusinessGuard } from 'src/common/guards/business.guard';

@Controller('businesses/:businessId/staff/:staffId/services')
export class ServiceAssignmentsController {
  constructor(private readonly serviceAssignmentsService: ServiceAssignmentsService) {}

  /**
   * Private endpoint
   * Can access if is owner or admin of the business, also can access professional of the staff
   * @description Get all services assigned to a staff
   * @param staffId
   * @returns ServiceAssignment[]
   */
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN, BusinessRole.STAFF)
  @Get('managment')
  listAllByStaff(@Param() params: BusinessStaffParamsDto) {
    return this.serviceAssignmentsService.findManyByStaff(params);
  }

  /**
   * Public endpoint
   * Can access customer to create an appointment
   * @description Get all services assigned to a staff
   * @param staffId
   * @returns ServiceAssignment[]
   */
  @Get('')
  listByStaff(@Param() params: BusinessStaffParamsDto) {
    return this.serviceAssignmentsService.findPublicByStaff(params);
  }

  /**
   * Private endpoint
   * Can access if is owner or admin of the business, also can access professional of the staff
   * @description Assign a service to a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
  @Post(':serviceId')
  assignTo(@Param() params: BusinessStaffServiceParamsDto) {
    console.log(params);
    return this.serviceAssignmentsService.assignTo(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or business owner or business admin
   * @description Unassign a service from a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN, BusinessRole.STAFF)
  @Delete(':serviceId')
  unassignFrom(@Param() params: BusinessStaffServiceParamsDto) {
    return this.serviceAssignmentsService.unassignFrom(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or business owner or business admin
   * @description Update a service for a staff
   * @param serviceId
   * @param staffId
   * @param data
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN, BusinessRole.STAFF)
  @Put(':serviceId')
  update(@Param() params: BusinessStaffServiceParamsDto, @Body() dto: UpdateServiceAssigmentDto) {
    return this.serviceAssignmentsService.update(params, dto);
  }
}
