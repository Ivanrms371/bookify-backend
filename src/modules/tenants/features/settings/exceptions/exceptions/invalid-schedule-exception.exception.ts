import { BadRequestException } from '@nestjs/common';

export class InvalidScheduleException extends BadRequestException {
  constructor(message: string) {
    super({ code: 'INVALID_SCHEDULE_EXCEPTION', message });
  }
}
