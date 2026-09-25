import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from 'src/generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: MembershipRole[] | string[]) => SetMetadata(ROLES_KEY, roles);
