// cloudinary.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(fileBuffer: Buffer, folder?: string): Promise<CloudinaryResponse> {
    if (!fileBuffer) {
      throw new BadRequestException('No file uploaded');
    }
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as CloudinaryResponse);
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  deleteFile(publicId: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  deleteMultipleFiles(publicIds: string[]) {
    return new Promise((resolve, reject) => {
      cloudinary.api.delete_resources(publicIds, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
