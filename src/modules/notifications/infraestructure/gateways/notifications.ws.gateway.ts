import { WebSocketGateway, OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie'; // Importante para leer las cookies
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

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const rawCookies = client.handshake.headers.cookie;
      if (!rawCookies) throw new Error('No cookies found');

      const cookies = cookie.parse(rawCookies);
      const accessToken = cookies['access_token'];

      if (!accessToken) throw new Error('Access token missing');

      const payload = this.jwtService.validateAccessToken(accessToken);

      client.data.userId = payload.sub;
      await client.join(`user_${payload.sub}`);

      console.log(`✅ Socket autenticado vía Cookie: Usuario ${payload.sub}`);
    } catch (error) {
      console.log('❌ Fallo de autenticación en Socket:', error.message);
      client.disconnect();
    }
  }

  @OnEvent('in_app_notification.created')
  handleInAppMessage(event: InAppNotificationCreatedEvent) {
    const { userId, tenantId, title, message, actionUrl, type, readAt, createdAt } = event;
    this.server.to(`user_${userId}`).emit('in_app_notification.created', {
      userId,
      tenantId,
      title,
      message,
      actionUrl,
      type,
      readAt,
      createdAt,
    });
  }
}
