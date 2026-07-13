import { TenantType } from 'src/generated/prisma/enums';

export type CreateTenantInput = {
  name: string;
  slug: string;
  tenantType: TenantType;
};
