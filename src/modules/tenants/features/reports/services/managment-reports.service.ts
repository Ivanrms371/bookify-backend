import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { Staff } from 'src/auth/types/express-request.type';
import { ReportsRepository } from '../repository/reports.repository';
import { GetReportsQueryDto } from '../dto/get-reports-query.dto';
import { CustomerReportsMapper } from '../mappers/customer-reports.mapper';
import { MembershipRole } from 'src/generated/prisma/enums';

@Injectable()
export class ManagmentReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  private async hydrateCustomers(groupedData: any[]) {
    if (groupedData.length === 0) return [];

    const customerIds = groupedData.map((g) => g.customerId);
    const customers = await this.reportsRepository.findManyByCustomerIds(customerIds);

    return CustomerReportsMapper.toResponse(groupedData, customers);
  }

  async getFinancialSummary(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const tenantStats = await this.reportsRepository.getTenantRevenueSummary(tenantId, startDate, endDate);
    
    const staffStats = await this.reportsRepository.getStaffRevenueGrouped(tenantId, startDate, endDate);

    if (staffStats.length === 0) {
      const gross = Number(tenantStats._sum.revenue || 0);
      return { grossRevenue: gross, totalCommissions: 0, netRevenue: gross };
    }

    const staffIds = staffStats.map((stat) => stat.staffId);
    const staffMembers = await this.reportsRepository.getStaffMembersWithRoles(staffIds, tenantId);

    const grossRevenue = Number(tenantStats._sum.revenue || 0);
    let totalCommissions = 0;

    for (const stat of staffStats) {
      const staff = staffMembers.find((s) => s.id === stat.staffId);
      const commissionPercent = Number(staff?.commissionPercent || 0);
      const revenueGenerated = Number(stat._sum.revenue || 0);
      totalCommissions += revenueGenerated * (commissionPercent / 100);
    }

    const netRevenue = grossRevenue - totalCommissions;

    return {
      grossRevenue,
      totalCommissions,
      netRevenue,
    };
  }

  async getStaffCommissions(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const dailyStats = await this.reportsRepository.getStaffRevenueSum(tenantId, startDate, endDate);

    if (dailyStats.length === 0) return [];

    const staffIds = dailyStats.map(s => s.staffId);
    const staffMembers = await this.reportsRepository.getStaffMembersWithRoles(staffIds, tenantId);

    return dailyStats.map(stat => {
      const staff = staffMembers.find(s => s.id === stat.staffId);
      const generatedRevenue = Number(stat._sum.revenue || 0);
      const commissionPercent = Number(staff?.commissionPercent || 0);
      const amountToPay = generatedRevenue * (commissionPercent / 100);

      return {
        staffId: stat.staffId,
        name: staff?.displayName || 'Unknown',
        commissionPercent,
        generatedRevenue,
        amountToPay,
        isOwner: staff?.user?.memberships?.[0]?.role === 'OWNER'
      };
    });
  }

  async getTopServices(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const groupedServices = await this.reportsRepository.getServicesGroupedByRevenue(tenantId, startDate, endDate);

    if (groupedServices.length === 0) return [];

    const serviceIds = groupedServices.map((g) => g.serviceId);
    const services = await this.reportsRepository.findManyByServiceIds(serviceIds);

    return groupedServices.map((g) => {
      const service = services.find((s) => s.id === g.serviceId);
      return {
        serviceId: g.serviceId,
        serviceName: service?.name || 'Unknown Service',
        revenue: Number(g._sum.price || 0),
        count: g._count.id,
      };
    });
  }

  async getTopCustomersByDate(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const groupedCustomers = await this.reportsRepository.getTopCustomersByDate(tenantId, startDate, endDate);

    return this.hydrateCustomers(groupedCustomers);
  }

  async getWorstCustomersByDate(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const groupedCustomers = await this.reportsRepository.getWorstCustomersByDate(tenantId, startDate, endDate);

    return this.hydrateCustomers(groupedCustomers);
  }

  async getTopCustomersLifetime(tenantId: string) {
    const customers = await this.reportsRepository.getTopCustomersLifetime(tenantId);

    if (customers.length === 0) return [];

    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      appointmentsCount: c.completedAppointments,
      totalAmount: Number(c.totalSpent || 0),
    }));
  }

  async getWorstCustomersLifetime(tenantId: string) {
    const customers = await this.reportsRepository.getWorstCustomersLifetime(tenantId);

    if (customers.length === 0) return [];

    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      appointmentsCount: c.noShowCount,
      totalAmount: Number(c.totalSpent || 0),
    }));
  }

  async getMyPerformance(staff: Staff, tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const stats = await this.reportsRepository.getStaffRevenueSumByStaffId(staff.id, tenantId, startDate, endDate);

    const generatedRevenue = Number(stats._sum.revenue || 0);
    const commissionRate = Number(staff?.commissionPercent || 0) / 100;
    const commissionEarned = generatedRevenue * commissionRate;

    return {
        staffId: staff.id,
        displayName: staff.name,
        period: { startDate, endDate},
        stats: {
            completedAppointments: stats._sum.completed || 0,
            generatedRevenue,
            activeDays: stats._count.id,
            myCommission: commissionEarned,
            commissionPercent: staff?.commissionPercent
        }
    }
  }

  async getMyTopCustomers(staffId: string, tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const groupedCustomers = await this.reportsRepository.getTopCustomersByDate(tenantId, startDate, endDate, staffId);

    return this.hydrateCustomers(groupedCustomers);
  }

  async getMyWorstCustomers(staffId: string, tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));

    const groupedCustomers = await this.reportsRepository.getWorstCustomersByDate(tenantId, startDate, endDate, staffId);

    return this.hydrateCustomers(groupedCustomers);
  }

  async getTenantRevenueChartData(tenantId: string, query: GetReportsQueryDto) {
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));
    
    const dailyData= await this.reportsRepository.getDailyRevenueBreakdown(tenantId, startDate, endDate);
    
    const revenueMap = new Map();
    dailyData.forEach((d) => {
      const key = format(d.date, 'yyyy-MM-dd');
      revenueMap.set(key, Number(d._sum.revenue || 0));
    });

    return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        date: key,
        revenue: revenueMap.get(key) ?? 0,
      };
    });
  }

  async getStaffRevenueChartData(staffId: string, tenantId: string, query: GetReportsQueryDto){
    const startDate = startOfDay(new Date(query.startDate));
    const endDate = endOfDay(new Date(query.endDate));
    
    const dailyData= await this.reportsRepository.getStaffRevenueBreakdown(staffId, tenantId, startDate, endDate);
    
    const revenueMap = new Map();
    dailyData.forEach((d) => {
      const key = format(d.date, 'yyyy-MM-dd');
      revenueMap.set(key, Number(d._sum.revenue || 0));
    });

    return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        date: key,
        revenue: revenueMap.get(key) ?? 0,
      };
    });
  }
}
