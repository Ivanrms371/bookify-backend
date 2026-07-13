import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { GetReportsQueryDto } from '../dto/get-reports-query.dto';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { ManagmentReportsService } from '../services/managment-reports.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { EmployeeGuard } from 'src/common/guards/employee.guard';

@UseGuards(TenantGuard)
@MembershipRoles(MembershipRole.OWNER)
@Controller('tenants/:tenantId/owner/reports')
export class OwnerReportsController {
  constructor(private readonly managmentReportsService: ManagmentReportsService) {}

  @Get('financial-summary')
  async getFinancialSummary(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getFinancialSummary(tenantId, query);
  }

  @Get('top-services')
  async getTopServices(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getTopServices(tenantId, query);
  }

  @Get('employee-performance')
  async getEmployeePerformance(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getEmployeeCommissions(tenantId, query);
  }

  @Get('top-customers')
  async getTopCustomers(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getTopCustomersByDate(tenantId, query);
  }

  @Get('worst-customers')
  async getWorstCustomers(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getWorstCustomersByDate(tenantId, query);
  }

  @UseGuards(EmployeeGuard)
  @Get('my-performance')
  async getMyPerformance(@Param('tenantId') tenantId: string, @Req() req: AuthenticatedRequest, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getMyPerformance(req.tenant.employee, tenantId, query);
  }

  @UseGuards(EmployeeGuard)
  @Get('my-top-customers')
  async getMyTopCustomers(@Param('tenantId') tenantId: string, @Req() req: AuthenticatedRequest, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getMyTopCustomers(req.tenant.employee.id, tenantId, query);
  }

  @Get('revenue-chart')
  async getTenantRevenueChartData(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto) {
    return this.managmentReportsService.getTenantRevenueChartData(tenantId, query);
  }

  @Get('/employees/:employeeId/revenue-chart')
  async getEmployeeRevenueChartData(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Query() query: GetReportsQueryDto,
  ) {
    return this.managmentReportsService.getEmployeeRevenueChartData(employeeId, tenantId, query);
  }

  @Get('my-revenue-chart')
  async getMyRevenueChartData(@Param('tenantId') tenantId: string, @Query() query: GetReportsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.managmentReportsService.getEmployeeRevenueChartData(req.tenant.employee.id, tenantId, query);
  }
}
