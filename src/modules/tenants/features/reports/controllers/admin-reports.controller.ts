import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { GetReportsQueryDto } from "../dto/get-reports-query.dto";
import { TenantGuard } from "src/common/guards/tenant.guard";
import { MembershipRoles } from "src/common/decorators/tenant-roles.decorator";
import { MembershipRole } from "src/generated/prisma/enums";
import { ManagmentReportsService } from "../services/managment-reports.service";
import { AuthenticatedRequest } from "src/auth/types/express-request.type";

@UseGuards(TenantGuard)
@MembershipRoles(MembershipRole.ADMIN)
@Controller("tenants/:tenantId/admin/reports")
export class AdminReportsController {
    constructor(
        private readonly managmentReportsService: ManagmentReportsService,
    ){}

    @Get("top-services")
    async getTopServices(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto
    ) {
        return this.managmentReportsService.getTopServices(tenantId, query);
    }

    @Get("top-customers")
    async getTopCustomers(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto
    ) {
        return this.managmentReportsService.getTopCustomersByDate(tenantId, query);
    }

    @Get("worst-customers")
    async getWorstCustomers(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto
    ) {
        return this.managmentReportsService.getWorstCustomersByDate(tenantId, query);
    }

    @Get("my-performance")
    async getMyPerformance(
        @Param("tenantId") tenantId: string,
        @Query() query: GetReportsQueryDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.managmentReportsService.getMyPerformance(req.tenant.staff, tenantId, query);
    }

    @Get('/staffs/:staffId/revenue-chart')
    async getStaffRevenueChartData(
        @Param("tenantId") tenantId: string,
        @Param("staffId") staffId: string,
        @Query() query: GetReportsQueryDto,
    ) {
        return this.managmentReportsService.getStaffRevenueChartData(staffId, tenantId, query);
    }
}