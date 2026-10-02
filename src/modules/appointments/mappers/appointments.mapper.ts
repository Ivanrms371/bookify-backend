import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export class AppointmentsMapper {
  static toResponse(appointment: any) {
    const timeZone = appointment.tenant?.settings?.timeZone ?? null;
    const formattedStartsAt = timeZone
      ? {
          date: formatInTimeZone(appointment.startsAt, timeZone, "d 'de' MMMM 'de' yyyy", { locale: es }),
          time: formatInTimeZone(appointment.startsAt, timeZone, 'HH:mm', { locale: es }),
        }
      : null;

    return {
      id: appointment.id,
      serviceId: appointment.serviceId,
      customerId: appointment.customerId,
      professionalId: appointment.professionalId,
      status: appointment.status,
      timeZone,
      formattedStartsAt,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      notes: appointment.notes,
      internalNotes: appointment.internalNotes,
      confirmationCode: appointment.manageToken,
      price: appointment.price,
      discountType: appointment.discountPercentage ? 'PERCENTAGE' : appointment.discountFixed ? 'FIXED' : undefined,
      discountAmount: appointment.discountAmount,
      durationMinutes: appointment.durationMinutes,
      professionalName: appointment.professional?.name || appointment.professional?.user?.name || null,
      professionalEmail: appointment.professional?.email ?? null,
      professionalPhone: appointment.professional?.phoneNumber ?? null,
      professionalPhoneCountryCode: appointment.professional?.phoneCountryCode ?? null,
      professionalAvatar: appointment.professional?.avatarUrl || appointment.professional?.user?.avatarUrl || null,
      professionalBio: appointment.professional?.bio || null,
      serviceName: appointment.service?.name || null,
      serviceDuration: appointment.service?.durationMinutes || null,
      servicePrice: appointment.service?.price || null,
    };
  }

  static toResponseList(appointments: any[]) {
    return appointments.map((appointment) => this.toResponse(appointment));
  }
}
