import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';
import { MediaService } from './media.service';
import { ImageType, UploadResult, DeleteResult } from './types';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: ImageType,
    @GetTenantId() tenantId: string,
  ): Promise<UploadResult> {
    return this.mediaService.upload(file, type, tenantId);
  }

  @Delete(':publicId')
  async delete(
    @Param('publicId') publicId: string,
  ): Promise<DeleteResult> {
    return this.mediaService.delete(publicId);
  }
}
