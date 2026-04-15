
export class CustomerReportsMapper {
  static toResponse(groupedData: any[], customers: any[]) {
    return groupedData.map((g) => {
      const customer = customers.find((c) => c.id === g.customerId);
      
      return {
        customerId: g.customerId,
        customerName: customer?.name || 'Cliente Desconocido',
        customerPhone: customer?.phone || '',
        appointmentsCount: g._count?.id || 0,
        totalAmount: Number(g._sum?.price || 0),
      };
    });
  }
}