import { Controller, Get, Param, Patch, Body, ParseUUIDPipe, Req, UseGuards, Post, Put } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants')
export class TenantsController {}
