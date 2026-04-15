import { Controller, Get, Param, Post, Body, Put, Patch, UseGuards, Delete } from '@nestjs/common';
import { ServiceAssignmentsService } from './service-assignments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { TenantStaffParamsDto } from './dto/params/tenant-staff.params.dto';
import { TenantStaffServiceParamsDto } from './dto/params/tenant-staff-service.params.dto';
import { UpdateServiceAssigmentDto } from './dto/body/update-service-assignment.dto';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@Controller('tenants/:tenantId/staff/:staffId/services')
export class ServiceAssignmentsController {
  constructor(private readonly serviceAssignmentsService: ServiceAssignmentsService) {}

  /**
   * Private endpoint
   * Can access if is owner or admin of the tenant, also can access professional of the staff
   * @description Get all services assigned to a staff
   * @param staffId
   * @returns ServiceAssignment[]
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.STAFF)
  @Get('managment')
  listAllByStaff(@Param() params: TenantStaffParamsDto) {
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
  listByStaff(@Param() params: TenantStaffParamsDto) {
    return this.serviceAssignmentsService.findPublicByStaff(params);
  }

  /**
   * Private endpoint
   * Can access if is owner or admin of the tenant, also can access professional of the staff
   * @description Assign a service to a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Post(':serviceId')
  assignTo(@Param() params: TenantStaffServiceParamsDto) {
    console.log(params);
    return this.serviceAssignmentsService.assignTo(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or tenant owner or tenant admin
   * @description Unassign a service from a staff
   * @param serviceId
   * @param staffId
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.STAFF)
  @Delete(':serviceId')
  unassignFrom(@Param() params: TenantStaffServiceParamsDto) {
    return this.serviceAssignmentsService.unassignFrom(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same staff or tenant owner or tenant admin
   * @description Update a service for a staff
   * @param serviceId
   * @param staffId
   * @param data
   * @returns ServiceAssignment
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.STAFF)
  @Put(':serviceId')
  update(@Param() params: TenantStaffServiceParamsDto, @Body() dto: UpdateServiceAssigmentDto) {
    return this.serviceAssignmentsService.update(params, dto);
  }
}
