import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { UsersService } from 'src/modules/users/users.service';
import { VerificationCreatedListener } from '../listeners/verifications/verification-created.listener';
import { NotificationsService } from '../application/services/notifications.service';

it('awaits the Nest-registered customer listener before committing its transaction', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let written = false;
  const notifications = {
    createOccurrence: jest.fn(() =>
      gate.then(() => {
        written = true;
      }),
    ),
  };
  const app = await Test.createTestingModule({
    imports: [EventEmitterModule.forRoot()],
    providers: [
      VerificationCreatedListener,
      { provide: NotificationsService, useValue: notifications },
      { provide: ConfigService, useValue: new ConfigService() },
      { provide: UsersService, useValue: {} },
    ],
  }).compile();
  await app.init();
  let committed = false;
  const emission = app
    .get(EventEmitter2)
    .emitAsync('verification.created', {
      verificationId: 'v',
      type: 'CUSTOMER_VERIFICATION_EMAIL',
      recipientType: 'CUSTOMER',
      recipientId: 'c',
      tenantId: 't',
      channel: 'EMAIL',
      code: '123456',
      email: 'customer@example.test',
      expiresAt: new Date(),
      tx: {},
    })
    .then(() => {
      committed = true;
    });
  try {
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(notifications.createOccurrence).toHaveBeenCalledTimes(1);
    expect(committed).toBe(false);
    release();
    await emission;
    expect(written).toBe(true);
    expect(committed).toBe(true);
  } finally {
    release();
    await emission;
    await app.close();
  }
});
