import { Module } from "@nestjs/common";
import { OwnerReportsController } from "./controllers/owner-reports.controller";
import { StaffReportsController } from "./controllers/staff-reports.controller";
import { AdminReportsController } from "./controllers/admin-reports.controller";
import { ReportsRepository } from "./repository/reports.repository";
import { ManagmentReportsService } from "./services/managment-reports.service";

@Module({
  controllers: [
    OwnerReportsController,
    StaffReportsController,
    AdminReportsController,
  ],
  providers: [
    ManagmentReportsService,
    ReportsRepository,
  ],
})
export class TenantReportsModule {}