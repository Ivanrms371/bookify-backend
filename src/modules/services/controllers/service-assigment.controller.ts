import { Controller, Get, Param, Post, Body, Put, Patch, UseGuards } from '@nestjs/common';
import { ServiceAssigmentService } from '../services/service-assigment.service';
import { ServiceAssignmentUpdateInput } from 'src/generated/prisma/models';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BusinessGuard } from 'src/auth/guards/business.guard';
import { BusinessRoles } from 'src/auth/decorators/business-roles.decorator';
import { StaffRole } from 'src/generated/prisma/enums';
import { StaffAccessGuard } from 'src/auth/guards/staff-access.guard';

@Controller('staffs/:staffId/services')
export class ServiceAssigmentController {
  constructor(private readonly serviceAssigmentService: ServiceAssigmentService) {}

  /**
   * Private endpoint
   * Can access if is owner or admin of the business, also can access professional of the staff
   * @description Get all services assigned to a staff
   * @param staffId
   * @returns ServiceAssignment[]
   */
  @UseGuards(JwtAuthGuard, BusinessGuard)
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN, StaffRole.PROFESSIONAL)
  @Get('management')
  listAllByStaff(@Param('staffId') staffId: string) {
    return this.serviceAssigmentService.findManyByStaff(staffId);
  }

  /**
   * Public endpoint
   * Can access customer to create an appointment
   * @description Get all services assigned to a staff
   * @param staffId
   * @returns ServiceAssignment[]
   */
  @Get()
  listByStaff(@Param('staffId') staffId: string) {
    return this.serviceAssigmentService.findPublicByStaff(staffId);
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
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN)
  @Post(':serviceId/assign')
  assignTo(@Param('serviceId') serviceId: string, @Param('staffId') staffId: string) {
    return this.serviceAssigmentService.assignTo(serviceId, staffId);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or business owner or business admin
   * @description Unassign a service from a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard, StaffAccessGuard)
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN, StaffRole.PROFESSIONAL)
  @Post(':serviceId/unassign')
  unassignFrom(@Param('serviceId') serviceId: string, @Param('staffId') staffId: string) {
    return this.serviceAssigmentService.unassignFrom(serviceId, staffId);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or business owner or business admin
   * @description Activate a service for a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard, StaffAccessGuard)
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN, StaffRole.PROFESSIONAL)
  @Patch(':serviceId/activate')
  activate(@Param('serviceId') serviceId: string, @Param('staffId') staffId: string) {
    return this.serviceAssigmentService.activate(serviceId, staffId);
  }

  /**
   * Private endpoint
   * Can access if user is
   * @description Deactivate a service for a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, BusinessGuard, StaffAccessGuard)
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN, StaffRole.PROFESSIONAL)
  @Patch(':serviceId/deactivate')
  deactivate(@Param('serviceId') serviceId: string, @Param('staffId') staffId: string) {
    return this.serviceAssigmentService.deactivate(serviceId, staffId);
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
  @UseGuards(JwtAuthGuard, BusinessGuard, StaffAccessGuard)
  @BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN, StaffRole.PROFESSIONAL)
  @Put(':serviceId')
  update(
    @Param('serviceId') serviceId: string,
    @Param('staffId') staffId: string,
    @Body() data: ServiceAssignmentUpdateInput,
  ) {
    return this.serviceAssigmentService.update(serviceId, staffId, data);
  }
}
