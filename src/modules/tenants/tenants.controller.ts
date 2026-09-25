import { Controller, Get, Param, Patch, Body, ParseUUIDPipe, Req, Post, Put } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('tenants')
export class TenantsController {}
