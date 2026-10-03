import { Controller, Get, Header, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';

@Controller('payments')
@Permissions(PERMISSIONS.BILLING_READ)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(@GetTenantId() tenantId: string, @Query() query: ListPaymentsDto) {
    return this.paymentsService.list(tenantId, query);
  }

  @Get(':paymentId/invoice')
  @Header('Cache-Control', 'private, no-store')
  getInvoice(@GetTenantId() tenantId: string, @Param('paymentId', new ParseUUIDPipe()) paymentId: string) {
    return this.paymentsService.getInvoice(tenantId, paymentId);
  }
}
