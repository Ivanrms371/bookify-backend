export type StaffFindAllParams = {
  query?: string;
  skip?: number;
  take?: number;
  orderBy?: 'displayOrder' | 'createdAt';
  order?: 'asc' | 'desc';
};

export type StaffFindAllByTenantParams = StaffFindAllParams & { tenantId: string };
