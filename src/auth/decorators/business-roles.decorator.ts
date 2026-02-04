import { SetMetadata } from '@nestjs/common';
import { StaffRole } from 'src/generated/prisma/enums';

export const PERMISSIONS_KEY = 'permissions';
export const BusinessRoles = (...roles: StaffRole[]) => SetMetadata(PERMISSIONS_KEY, roles);
