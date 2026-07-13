export class AppointmentMapper {
  static toDashboardUpcoming(appt: any) {
    return {
      id: appt.id,
      startTime: appt.startTime,
      durationMinutes: appt.durationMinutes,
      customerName: appt.customerName,
      customerPhone: appt.customerPhone,
      confirmationCode: appt.confirmationCode,
      employeeName: appt.employee?.displayName || 'Desconocido',
      total: Number(appt.price),
    };
  }

  static toCalendarEvent(appt: any) {
    return {
      id: appt.id,
      status: appt.status,
      startTime: appt.startTime,
      endTime: appt.endTime,
      durationMinutes: appt.durationMinutes,
      customerName: appt.customerName,
      confirmationCode: appt.confirmationCode,
      employee: appt.employee
        ? {
            id: appt.employee.id,
            displayName: appt.employee.displayName,
            colorTheme: appt.employee.colorTheme,
            avatarUrl: appt.employee.avatarUrl,
          }
        : null,
    };
  }
  static toDetail(appt: any) {
    return {
      id: appt.id,
      status: appt.status,
      startTime: appt.startTime,
      endTime: appt.endTime,
      durationMinutes: appt.durationMinutes,
      customerName: appt.customerName,
      customerPhone: appt.customerPhone,
      customerEmail: appt.customerEmail ?? null,
      confirmationCode: appt.confirmationCode,
      notes: appt.notes,
      price: Number(appt.price),
      employee: appt.employee
        ? {
            id: appt.employee.id,
            displayName: appt.employee.displayName,
            colorTheme: appt.employee.colorTheme,
            avatarUrl: appt.employee.avatarUrl,
          }
        : null,
      service: appt.service
        ? {
            name: appt.service.name,
            price: Number(appt.service.price),
            durationMinutes: appt.service.durationMinutes,
          }
        : null,
      customer: appt.customer
        ? {
            totalAppointments: appt.customer.totalAppointments,
            completedAppointments: appt.customer.completedAppointments,
            cancelledAppointments: appt.customer.cancelledAppointments,
            noShowCount: appt.customer.noShowCount,
          }
        : null,
    };
  }
}
