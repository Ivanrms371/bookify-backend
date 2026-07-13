import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll() {
    return this.plansService.findAll();
  }
}
