import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/shared/integrations/cloudinary/cloudinary.service';
import { getImageConfig, validateImage, generateFilePath, ImageType } from './image.rules';
import { processImage } from './image.processor';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async upload(file: Express.Multer.File, type: ImageType, tenantId: string): Promise<UploadResult> {
    const config = getImageConfig(type);

    console.log(file);

    validateImage(file, config);

    const processed = await processImage(file.buffer, config);

    const path = generateFilePath(tenantId, type);

    const result = await this.cloudinaryService.upload(processed, path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
