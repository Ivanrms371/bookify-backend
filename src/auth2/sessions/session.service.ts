import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  constructor() {}

  createCustomerSession() {}

  createStaffSession() {}

  rotateRefreshToken() {}

  revokeSession() {}

  validateRefreshToken() {}
}
