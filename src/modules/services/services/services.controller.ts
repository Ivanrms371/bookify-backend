import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';
import { ParseUUIDv7Pipe } from 'src/common/pipes/validate-uuidv7.pipe';
import { BusinessGuard } from 'src/common/guards/business.guard';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
@Controller('business/:businessId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listByBusiness(@Param('businessId') businessId: string) {
    return this.servicesService.findAllServicesByBusiness(businessId);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.servicesService.findServiceById(id);
  }

  @Patch('reorder')
  reorder(@Param('businessId') businessId: string, @Body() orders: ReorderServiceDto[]) {
    return this.servicesService.reorderServices(businessId, orders);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]),
  )
  create(
    @Param('businessId') businessId: string,
    @Body() data: CreateServiceDto,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    return this.servicesService.createService(businessId, data, files);
  }

  @Put(':id')
  update(@Param('id') id: string, @Param('businessId') businessId: string, @Body() data: UpdateServiceDto) {
    return this.servicesService.updateService(id, businessId, data);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.servicesService.activateService(id, businessId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.servicesService.deactivateService(id, businessId);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.servicesService.softDeleteService(id, businessId);
  }
}
