import { Module } from '@nestjs/common';
import { LemonSqueezyService } from './lemon-squeezy.service';

@Module({
  providers: [LemonSqueezyService],
  exports: [LemonSqueezyService],
})
export class LemonSqueezyModule {}
