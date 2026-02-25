import { SetMetadata } from '@nestjs/common';
import { BusinessRole } from 'src/generated/prisma/enums';

export const PERMISSIONS_KEY = 'permissions';
export const BusinessRoles = (...roles: BusinessRole[]) => SetMetadata(PERMISSIONS_KEY, roles);
