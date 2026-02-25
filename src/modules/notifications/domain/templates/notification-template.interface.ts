import { NotificationChannel } from 'src/generated/prisma/enums';

export interface NotificationTemplate {
  type: string;
  build(channel: NotificationChannel, variables: any): any;
}
