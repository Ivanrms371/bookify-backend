import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantRevenueSummary(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.aggregate({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        revenue: true,
        completed: true,
        newCustomers: true,
      },
    });
  }

  async getEmployeeRevenueGrouped(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.employeeDailyStats.groupBy({
      by: ['employeeId'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        revenue: true,
      },
    });
  }

  async getEmployeeCommissions(employeeIds: string[]) {
    return this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, commissionPercent: true },
    });
  }

  async getServicesGroupedByRevenue(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        tenantId,
        startTime: { gte: startDate, lte: endDate },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 10,
    });
  }

  async findManyByServiceIds(serviceIds: string[]) {
    return this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getTopCustomersByDate(tenantId: string, startDate: Date, endDate: Date, employeeId?: string) {
    return await this.prisma.appointment.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        status: 'COMPLETED',
        startTime: { gte: startDate, lte: endDate },
        ...(employeeId && { employeeId }),
      },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 10,
    });
  }

  async getWorstCustomersByDate(tenantId: string, startDate: Date, endDate: Date, employeeId?: string) {
    return await this.prisma.appointment.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        status: { in: ['CANCELLED', 'NO_SHOW'] },
        startTime: { gte: startDate, lte: endDate },
        ...(employeeId && { employeeId }),
      },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  }

  async getTopCustomersLifetime(tenantId: string) {
    return await this.prisma.customer.findMany({
      where: { tenantId, totalSpent: { gt: 0 } },
      orderBy: { totalSpent: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        completedAppointments: true,
        totalSpent: true,
      },
    });
  }

  async getWorstCustomersLifetime(tenantId: string) {
    return await this.prisma.customer.findMany({
      where: { tenantId, OR: [{ noShowCount: { gt: 0 } }, { cancelledAppointments: { gt: 0 } }] },
      orderBy: { noShowCount: 'desc', cancelledAppointments: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        noShowCount: true,
        cancelledAppointments: true,
        totalSpent: true,
      },
    });
  }

  async findManyByCustomerIds(customerIds: string[]) {
    return await this.prisma.customer.findMany({
      where: {
        id: { in: customerIds },
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });
  }

  async getEmployeeRevenueSum(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.employeeDailyStats.groupBy({
      by: ['employeeId'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        revenue: { gt: 0 },
      },
      _sum: { revenue: true },
    });
  }

  async getEmployeeMembersWithRoles(employeeIds: string[], tenantId: string) {
    return this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        displayName: true,
        commissionPercent: true,
        user: {
          select: {
            memberships: {
              where: { tenantId },
              select: { role: true },
            },
          },
        },
      },
    });
  }

  async getEmployeeMemberWithRole(employeeId: string, tenantId: string) {
    return this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        displayName: true,
        commissionPercent: true,
        user: {
          select: {
            memberships: {
              where: { tenantId },
              select: { role: true },
            },
          },
        },
      },
    });
  }

  async getEmployeeRevenueSumByEmployeeId(tenantId: string, employeeId: string, startDate: Date, endDate: Date) {
    return this.prisma.employeeDailyStats.aggregate({
      where: {
        tenantId,
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { revenue: true, completed: true },
      _count: { id: true },
    });
  }

  async getDailyRevenueBreakdown(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.groupBy({
      by: ['date'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { revenue: true },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async getEmployeeRevenueBreakdown(employeeId: string, tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.employeeDailyStats.groupBy({
      by: ['date'],
      where: {
        tenantId,
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { revenue: true },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
