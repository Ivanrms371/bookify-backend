export type FindAllCustomersParams = {
  tenantId: string;
  take?: number;
  skip?: number;
  orderBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
};
