import type { MembershipRole } from 'src/generated/prisma/enums';
import type {
  AccessViewer,
  ProfessionalAccessStatus,
  ProfessionalAccessAction,
  ProfessionalContactFields,
} from '../types/professional-access.types';

export function accessStatus(
  userId: string | null,
  membership: { isActive: boolean } | null | undefined,
  invitation: { expiresAt: Date } | null | undefined,
): ProfessionalAccessStatus {
  if (userId) {
    if (membership?.isActive) {
      return 'ACTIVE';
    }
    return 'DISABLED';
  }
  if (invitation) {
    if (invitation.expiresAt > new Date()) {
      return 'PENDING';
    }
    return 'EXPIRED';
  }
  return 'NONE';
}

export function canChangeAccess(viewer: AccessViewer, userId: string | null, role?: MembershipRole | null) {
  if (viewer.role !== 'OWNER' && viewer.role !== 'ADMIN') {
    return false;
  }
  if (viewer.id === userId) {
    return false;
  }
  if (role === 'OWNER') {
    return false;
  }
  if (role === 'ADMIN' && viewer.role !== 'OWNER') {
    return false;
  }
  return true;
}

export function resolveAccessAction(
  status: ProfessionalAccessStatus,
  giveAccess: boolean | undefined,
  recipientChanged: boolean,
): ProfessionalAccessAction {
  switch (status) {
    case 'ACTIVE':
      if (giveAccess === false) {
        return 'DISABLE_MEMBERSHIP';
      }
      return 'KEEP';
    case 'DISABLED':
      if (giveAccess === true) {
        return 'RESTORE_MEMBERSHIP';
      }
      return 'KEEP';
    case 'PENDING':
      if (giveAccess === false) {
        return 'CANCEL_INVITATION';
      }
      if (recipientChanged) {
        return 'INVITE';
      }
      return 'KEEP';
    case 'NONE':
    case 'EXPIRED':
      if (giveAccess === true) {
        return 'INVITE';
      }
      return 'KEEP';
  }
}

// Services can also be called outside HTTP, so create and update share the same normalization.
export function normalizeProfessionalContact<T extends ProfessionalContactFields>(dto: T) {
  return {
    ...dto,
    name: dto.name?.trim(),
    email: dto.email?.trim().toLowerCase(),
    phoneCountryCode: dto.phoneCountryCode?.trim().replace(/^\+/, ''),
    phoneNumber: dto.phoneNumber?.trim().replace(/[\s()-]/g, ''),
  };
}
