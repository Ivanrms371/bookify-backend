import { CommissionType } from 'src/generated/prisma/enums';

export type UpdateEmployeeInput = {
  displayName?: string;
  isActive?: boolean;
  title?: string;
  bio?: string;
  colorTheme?: string;
  commissionType?: CommissionType;
  commissionPercent?: string;
  commissionFixed?: string;
};
