import { Controller, Get } from '@nestjs/common';
import { SkipTenant } from 'src/common/security/decorators/skip-tenant.decorator';
import { getLocationOptions } from './location-catalog';

@Controller('locations')
export class LocationController {
  @SkipTenant()
  @Get('options')
  getOptions() {
    return getLocationOptions();
  }
}
