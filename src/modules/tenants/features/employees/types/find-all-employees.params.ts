export type EmployeeFindAllParams = {
  query?: string;
  skip?: number;
  take?: number;
  orderBy?: 'displayOrder' | 'createdAt';
  order?: 'asc' | 'desc';
};

export type EmployeeFindAllByTenantParams = EmployeeFindAllParams & { tenantId: string };
