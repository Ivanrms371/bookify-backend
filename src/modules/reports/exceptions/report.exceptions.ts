import { BadRequestException, NotFoundException } from '@nestjs/common';

export class InvalidReportPeriodException extends BadRequestException {
  constructor(message: string) {
    super({ code: 'INVALID_REPORT_PERIOD', message });
  }
}

export class ReportFilterNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'REPORT_FILTER_NOT_FOUND', message: 'El profesional o servicio no pertenece a este espacio.' });
  }
}

export class ReportSettingsNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'REPORT_SETTINGS_NOT_FOUND', message: 'No se encontró la configuración del espacio.' });
  }
}
