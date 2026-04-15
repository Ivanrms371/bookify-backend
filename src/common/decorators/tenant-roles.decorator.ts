import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from 'src/generated/prisma/enums';

export const PERMISSIONS_KEY = 'permissions';
export const MembershipRoles = (...roles: MembershipRole[]) => SetMetadata(PERMISSIONS_KEY, roles);
