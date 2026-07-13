import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AcceptInviteParams } from './types/accept-invite.params';

@Public()
@Controller('memberships/invite')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('validate')
  async validateInvite(@Query('token') token: string) {
    return this.membershipsService.validateInvite(token);
  }

  @Post('accept')
  async acceptInvite(@Body() dto: AcceptInviteDto, @Query() params: AcceptInviteParams) {
    console.log(dto, params);
    return this.membershipsService.acceptInvite(dto, params);
  }
}
