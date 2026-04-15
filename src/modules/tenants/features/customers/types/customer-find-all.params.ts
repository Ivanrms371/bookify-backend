export type FindAllCustomersParams = {
  tenantId: string;
  query?: string;
  take?: number;
  skip?: number;
  orderBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
};
