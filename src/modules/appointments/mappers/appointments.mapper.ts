export class AppointmentsMapper {
  static toResponse(appointment: any) {
    return {
      id: appointment.id,
      serviceId: appointment.serviceId,
      customerId: appointment.customerId,
      professionalId: appointment.professionalId,
      status: appointment.status,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      notes: appointment.notes,
      internalNotes: appointment.internalNotes,
      confirmationCode: appointment.manageToken,
      price: appointment.price,
      discountType: appointment.discountPercentage ? 'PERCENTAGE' : (appointment.discountFixed ? 'FIXED' : undefined),
      discountAmount: appointment.discountAmount,
      durationMinutes: appointment.durationMinutes,
      professionalName: appointment.professional?.displayName || appointment.professional?.user?.name || null,
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
