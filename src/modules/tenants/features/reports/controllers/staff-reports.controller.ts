import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { GetReportsQueryDto } from "../dto/get-reports-query.dto";
import { AuthenticatedRequest } from "src/auth/types/express-request.type";
import { ManagmentReportsService } from "../services/managment-reports.service";
import { StaffGuard } from "src/common/guards/staff.guard";
import { TenantGuard } from "src/common/guards/tenant.guard";
import { MembershipRole } from "src/generated/prisma/enums";
import { MembershipRoles } from "src/common/decorators/tenant-roles.decorator";

@UseGuards(TenantGuard, StaffGuard)
@MembershipRoles(MembershipRole.STAFF)
@Controller("tenants/:tenantId/staff/reports")
export class StaffReportsController {
    constructor(
        private readonly managmentReportsService: ManagmentReportsService,
    ){}

    @Get("my-performance")
    async getMyPerformance(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.managmentReportsService.getMyPerformance(req.tenant.staff, tenantId, query);
    }

    @Get("my-customers")
    async getMyCustomers(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.managmentReportsService.getMyTopCustomers(req.tenant.staff.id, tenantId, query);
    }

    @Get("my-worst-customers")
    async getMyWorstCustomers(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.managmentReportsService.getMyWorstCustomers(req.tenant.staff.id, tenantId, query);
    }

    @Get('my-revenue-chart')
    async getMyRevenueChartData(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.managmentReportsService.getStaffRevenueChartData(req.tenant.staff.id, tenantId, query);
    }
}