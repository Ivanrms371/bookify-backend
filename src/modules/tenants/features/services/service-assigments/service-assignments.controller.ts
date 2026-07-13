import { Controller, Get, Param, Post, Body, Put, Patch, UseGuards, Delete } from '@nestjs/common';
import { ServiceAssignmentsService } from './service-assignments.service';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { TenantEmployeeParamsDto } from './dto/params/tenant-employee.params.dto';
import { TenantEmployeeServiceParamsDto } from './dto/params/tenant-employee-service.params.dto';
import { UpdateServiceAssigmentDto } from './dto/body/update-service-assignment.dto';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@Controller('tenants/:tenantId/employee/:employeeId/services')
export class ServiceAssignmentsController {
  constructor(private readonly serviceAssignmentsService: ServiceAssignmentsService) {}

  /**
   * Private endpoint
   * Can access if is owner or admin of the tenant, also can access professional of the employee
   * @description Get all services assigned to a employee
   * @param employeeId
   * @returns ServiceAssignment[]
   */
  @UseGuards(TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.EMPLOYEE)
  @Get('managment')
  listAllByEmployee(@Param() params: TenantEmployeeParamsDto) {
    return this.serviceAssignmentsService.findManyByEmployee(params);
  }

  /**
   * Public endpoint
   * Can access customer to create an appointment
   * @description Get all services assigned to a employee
   * @param employeeId
   * @returns ServiceAssignment[]
   */
  @Get('')
  listByEmployee(@Param() params: TenantEmployeeParamsDto) {
    return this.serviceAssignmentsService.findPublicByEmployee(params);
  }

  /**
   * Private endpoint
   * Can access if is owner or admin of the tenant, also can access professional of the employee
   * @description Assign a service to a employee
   * @param serviceId
   * @param employeeId
   * @returns ServiceAssignment
   */
  @UseGuards(TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Post(':serviceId')
  assignTo(@Param() params: TenantEmployeeServiceParamsDto) {
    console.log(params);
    return this.serviceAssignmentsService.assignTo(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same employee or tenant owner or tenant admin
   * @description Unassign a service from a employee
   * @param serviceId
   * @param employeeId
   * @returns ServiceAssignment
   */
  @UseGuards(TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.EMPLOYEE)
  @Delete(':serviceId')
  unassignFrom(@Param() params: TenantEmployeeServiceParamsDto) {
    return this.serviceAssignmentsService.unassignFrom(params);
  }

  /**
   * Private endpoint
   * Can access if user is the same employee or tenant owner or tenant admin
   * @description Update a service for a employee
   * @param serviceId
   * @param employeeId
   * @param data
   * @returns ServiceAssignment
   */
  @UseGuards(TenantGuard)
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.EMPLOYEE)
  @Put(':serviceId')
  update(@Param() params: TenantEmployeeServiceParamsDto, @Body() dto: UpdateServiceAssigmentDto) {
    return this.serviceAssignmentsService.update(params, dto);
  }
}
