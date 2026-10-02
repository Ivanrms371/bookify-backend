import type { FindAllCustomersParams as CustomersQuery } from '../dto/find-all-customers-params.dto';

export type FindAllCustomersParams = CustomersQuery & { tenantId: string };
