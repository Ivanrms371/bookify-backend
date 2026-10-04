import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
export class OnboardingTenantNotFoundException extends NotFoundException {
  constructor() {
    super('Tenant not found');
  }
}
export class OnboardingStepUnavailableException extends ConflictException {
  constructor() {
    super('Complete the previous onboarding steps before continuing');
  }
}
export class OnboardingProfileRequiredException extends BadRequestException {
  constructor() {
    super('Elegí si vas a atender clientes antes de confirmar');
  }
}
export class OnboardingServicesChangedException extends BadRequestException {
  constructor() {
    super('Los servicios seleccionados cambiaron. Revisá tu perfil profesional antes de continuar');
  }
}
export class OnboardingProfessionalConflictException extends ConflictException {
  constructor() {
    super('Tu cuenta ya tiene un perfil profesional en otro negocio o un perfil eliminado. No podemos vincularlo automáticamente');
  }
}
export class OnboardingProfileInvalidException extends BadRequestException {
  constructor() {
    super('Completá tu nombre, correo, teléfono y al menos un servicio');
  }
}
export class OnboardingConfirmationUnavailableException extends BadRequestException {
  constructor() {
    super('Complete the onboarding steps before confirmation');
  }
}

export class OnboardingServicesInvalidException extends BadRequestException {
  constructor() {
    super('Ingresá al menos un servicio con nombre, precio válido y duración en minutos');
  }
}
