import { Controller, Post, Delete, Param, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { MediaService } from './media.service';
import { ImageType, UploadResult, DeleteResult } from './types';

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
  async delete(@Param('publicId') publicId: string): Promise<DeleteResult> {
    return this.mediaService.delete(publicId);
  }
}
