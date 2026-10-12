import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MediaModule } from 'src/shared/media/media.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { SubscriptionsRepository } from 'src/modules/subscriptions/subscriptions.repository';
import { ProfessionalsModule } from 'src/modules/professionals/professionals.module';
import { ProfessionalsService } from 'src/modules/professionals/professionals.service';
import { ServicesModule } from 'src/modules/services/services.module';
import { ServicesService } from 'src/modules/services/services.service';
import { NotificationUsageService } from 'src/modules/notifications/application/services/notification-usage.service';
import { NotificationConfigService } from 'src/modules/notifications/notification-config.service';
import { TenantUsageModule } from './tenant-usage.module';
import { TenantUsageService } from './tenant-usage.service';

@Module({})
class MockMediaModule {}

it('resolves shared usage dependencies without a reverse subscription module dependency', async () => {
  const module = await Test.createTestingModule({
    imports: [PrismaModule, TenantUsageModule, SubscriptionsModule, ProfessionalsModule, ServicesModule],
    providers: [NotificationUsageService, NotificationConfigService],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideModule(MediaModule)
    .useModule(MockMediaModule)
    .compile();
  try {
    for (const provider of [TenantUsageService, SubscriptionsRepository, ProfessionalsService, ServicesService, NotificationUsageService]) {
      expect(module.get(provider)).toBeInstanceOf(provider);
    }
  } finally {
    await module.close();
  }
});
