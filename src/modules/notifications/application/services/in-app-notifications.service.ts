import { Injectable } from '@nestjs/common';
import { InAppNotificationsRepository } from '../../infraestructure/repositories/in-app-notifications.repository';

@Injectable()
export class InAppNotificationsService {
  constructor(private readonly inAppNotificationsRepository: InAppNotificationsRepository) {}

  async count(userId: string) {
    return this.inAppNotificationsRepository.countUnread(userId);
  }
}
