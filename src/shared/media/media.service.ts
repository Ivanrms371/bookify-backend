import { BadRequestException, Injectable } from '@nestjs/common';
import sharp, { FormatEnum } from 'sharp';
import { CloudinaryService } from 'src/shared/integrations/cloudinary/cloudinary.service';
import { ImageType, ImageConfig, UploadResult, DeleteResult } from './types';
import { IMAGE_CONFIGS } from './image.config';

@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async upload(file: Express.Multer.File, type: ImageType, tenantId: string): Promise<UploadResult> {
    const config = this.getImageConfig(type);

    this.validateImage(file, config);

    const processed = await this.processImage(file.buffer, config);

    const path = this.generateFilePath(tenantId, type);

    const result = await this.cloudinaryService.upload(processed, path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async delete(publicId: string): Promise<DeleteResult> {
    const result = await this.cloudinaryService.delete(publicId);
    return { result: String(result) };
  }

  private getImageConfig(type: ImageType): ImageConfig {
    return IMAGE_CONFIGS[type];
  }

  private validateImage(file: { size: number }, config: ImageConfig): void {
    const maxBytes = config.maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      throw new BadRequestException(`La imagen excede el tamaño máximo permitido de ${config.maxSizeMB}MB`);
    }
  }

  private async processImage(buffer: Buffer, config: ImageConfig): Promise<Buffer> {
    let img = sharp(buffer);

    if (config.width || config.height) {
      img = img.resize(config.width, config.height);
    }

    if (config.format) {
      img = img.toFormat(config.format as keyof FormatEnum);
    }

    return await img.toBuffer();
  }

  private generateFilePath(tenantId: string, type: ImageType): string {
    return `${tenantId}/${type}/${Date.now()}`;
  }
}
