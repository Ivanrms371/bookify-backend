import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { CloudinaryResponse } from 'src/shared/cloudinary/cloudinary-response';
import sharp from 'sharp';

@Injectable()
export class BusinessImagesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  private readonly cloudinaryLogoFolder = 'business/logo';
  private readonly cloudinaryCoverFolder = 'business/cover';

  async uploadOnboardingImages(files: { logo?: Express.Multer.File; cover?: Express.Multer.File }) {
    const promises: Promise<CloudinaryResponse>[] = [];

    let logoResult: CloudinaryResponse | undefined;
    let coverResult: CloudinaryResponse | undefined;

    if (files.logo) {
      const logoProcess = this.upload(files.logo, this.cloudinaryLogoFolder, 256);
      promises.push(logoProcess.then((result) => (logoResult = result)));
    }
    if (files.cover) {
      const coverProcess = this.upload(files.cover, this.cloudinaryCoverFolder, 1280);
      promises.push(coverProcess.then((result) => (coverResult = result)));
    }

    await Promise.all(promises);

    return {
      logo: logoResult,
      cover: coverResult,
    };
  }

  async upload(file: Express.Multer.File, folder: string, width?: number, height?: number) {
    const image = await sharp(file.buffer)
      .resize({ width, height })
      .webp({ quality: 80 })
      .toBuffer();
    return this.cloudinaryService.uploadFile(image, folder);
  }

  async deleteOnboardingImages(publicIds: string[]) {
    return this.cloudinaryService.deleteMultipleFiles(publicIds);
  }
}
