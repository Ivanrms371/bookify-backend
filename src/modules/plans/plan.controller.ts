import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlatformAdminGuard } from 'src/auth/guards/platform-admin.guard';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async findAllPlans() {
    return this.planService.findAllPlans();
  }

  @Get('/:id')
  async findPlanById(@Param('id') id: string) {
    return this.planService.findPlanById(id);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post()
  async createPlan(@Body() data: CreatePlanDto) {
    return this.planService.createPlan(data);
  }
}
