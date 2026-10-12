import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { appointmentUrl } from '../../application/templates/_components/appointment-links';

@Injectable()
export class AppointmentNotificationRepository {
  private readonly logger = new Logger(AppointmentNotificationRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findById(tenantId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: {
        id: true,
        tenantId: true,
        professionalId: true,
        customerId: true,
        customerName: true,
        startsAt: true,
        createdBy: true,
        status: true,
        professional: {
          select: {
            name: true,
            deletedAt: true,
            user: { select: { memberships: { where: { tenantId, isActive: true }, select: { id: true } } } },
          },
        },
        customer: { select: { name: true } },
        service: { select: { name: true } },
        tenant: { select: { slug: true, settings: { select: { timeZone: true } } } },
      },
    });
    if (!appointment) return null;
    const timeZone = appointment.tenant.settings?.timeZone || 'America/Montevideo';
    if (!appointment.tenant.settings?.timeZone)
      this.logger.warn(`Missing notification timezone for tenant ${tenantId}; using America/Montevideo`);
    new Intl.DateTimeFormat('es', { timeZone }).format();
    const origin = appointmentUrl(this.config.get<string>('FRONTEND_URL') || this.config.get<string>('APP_URL'));
    const hasDashboardAccess = !appointment.professional.deletedAt && Boolean(appointment.professional.user?.memberships.length);
    let professionalDetailsUrl: string | undefined;
    if (origin && appointment.tenant.slug && hasDashboardAccess) {
      const url = new URL(`/${encodeURIComponent(appointment.tenant.slug)}/calendar`, origin);
      url.searchParams.set('notificationAppointmentId', appointmentId);
      professionalDetailsUrl = url.toString();
    }
    return {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
      professionalId: appointment.professionalId,
      professionalName: appointment.professional.name,
      customerId: appointment.customerId,
      customerName: appointment.customerName ?? appointment.customer?.name ?? '',
      serviceName: appointment.service.name,
      startsAt: appointment.startsAt,
      createdBy: appointment.createdBy,
      status: appointment.status,
      timeZone,
      professionalDetailsUrl,
    };
  }
}
