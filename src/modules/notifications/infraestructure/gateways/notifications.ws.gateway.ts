import { WebSocketGateway, OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { isUUID } from 'class-validator';
import { MembershipsService } from 'src/modules/memberships/memberships.service';
import { JwtService } from 'src/auth/infrastructure/jwt/jwt.service';
import { OnEvent } from '@nestjs/event-emitter';
import { InAppNotificationCreatedEvent } from '../../domain/events/in-app-notification.event';
import { corsOptions } from 'src/config/cors.config';

@WebSocketGateway({
  namespace: 'notifications',
  cors: corsOptions,
})
export class NotificationsWsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawCookies = client.handshake.headers.cookie;
      if (!rawCookies) throw new Error('No cookies found');

      const cookies = cookie.parse(rawCookies);
      const accessToken = cookies['access_token'];

      if (!accessToken) throw new Error('Access token missing');

      const payload = this.jwtService.validateAccessToken(accessToken);

      const tenantId = client.handshake.auth?.tenantId;
      if (typeof tenantId !== 'string' || !isUUID(tenantId)) throw new Error('Invalid tenant');
      const membership = await this.membershipsService.findByUserId(tenantId, payload.sub);
      if (!membership?.isActive) throw new Error('Active membership required');
      if (!client.connected) return;

      client.data.userId = payload.sub;
      client.data.tenantId = tenantId;
      await client.join(this.room(tenantId, payload.sub));
    } catch (error) {
      client.disconnect();
    }
  }

  @OnEvent('in_app_notification.created')
  handleInAppMessage(event: InAppNotificationCreatedEvent) {
    const { userId, tenantId } = event;
    this.server.to(this.room(tenantId, userId)).emit('notifications.changed', { tenantId });
  }

  private room(tenantId: string, userId: string) {
    return `tenant_${tenantId}:user_${userId}`;
  }
}
