import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlatformAdminGuard } from 'src/common/guards/platform-admin.guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAllPlans() {
    return this.plansService.findAllPlans();
  }

  @Get('/:id')
  async findPlanById(@Param('id') id: string) {
    return this.plansService.findPlanById(id);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post()
  async createPlan(@Body() data: CreatePlanDto) {
    return this.plansService.createPlan(data);
  }
}
