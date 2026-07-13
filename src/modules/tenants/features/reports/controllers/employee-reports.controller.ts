import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { GetReportsQueryDto } from '../dto/get-reports-query.dto';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { ManagmentReportsService } from '../services/managment-reports.service';
import { EmployeeGuard } from 'src/common/guards/employee.guard';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRole } from 'src/generated/prisma/enums';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';

@UseGuards(TenantGuard, EmployeeGuard)
@MembershipRoles(MembershipRole.EMPLOYEE)
@Controller('tenants/:tenantId/employee/reports')
export class EmployeeReportsController {
  constructor(private readonly managmentReportsService: ManagmentReportsService) {}

  @Get('my-performance')
  async getMyPerformance(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.managmentReportsService.getMyPerformance(req.tenant.employee, tenantId, query);
  }

  @Get('my-customers')
  async getMyCustomers(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.managmentReportsService.getMyTopCustomers(req.tenant.employee.id, tenantId, query);
  }

  @Get('my-worst-customers')
  async getMyWorstCustomers(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.managmentReportsService.getMyWorstCustomers(req.tenant.employee.id, tenantId, query);
  }

  @Get('my-revenue-chart')
  async getMyRevenueChartData(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.managmentReportsService.getEmployeeRevenueChartData(req.tenant.employee.id, tenantId, query);
  }
}
