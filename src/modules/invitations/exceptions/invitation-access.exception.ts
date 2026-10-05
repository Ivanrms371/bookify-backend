import { ConflictException, ForbiddenException } from '@nestjs/common';
export class InvitationUnavailableException extends ConflictException {
  constructor(reason: 'revoked' | 'expired' | 'accepted' | 'changed' | 'disabled') {
    const messages = {
      revoked: 'Esta invitación ha sido revocada.',
      expired: 'Esta invitación ha expirado.',
      accepted: 'Esta invitación ya ha sido aceptada.',
      changed: 'La invitación cambió. Volvé a intentarlo.',
      disabled: 'El acceso de esta invitación ya no está activo.',
    };
    super(messages[reason]);
  }
}
export class InvitationRecipientException extends ForbiddenException {
  constructor() {
    super('Esta invitación no corresponde a tu cuenta activa.');
  }
}
export class InvitationMembershipConflictException extends ConflictException {
  constructor(inactive = false) {
    super(
      inactive
        ? 'El usuario ya tiene una membresía inactiva. Restaurá su acceso desde el equipo.'
        : 'El usuario ya es miembro de este espacio.',
    );
  }
}
export class InvitationProfessionalConflictException extends ConflictException {
  constructor() {
    super('La cuenta o el profesional ya están vinculados o no están disponibles.');
  }
}

export class InvitationDuplicateException extends ConflictException {
  constructor() {
    super('Ya existe una invitación pendiente o expirada para este correo. Reenviá la invitación existente.');
  }
}
