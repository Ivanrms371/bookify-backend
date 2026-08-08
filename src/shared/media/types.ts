export type ImageType = 'avatar' | 'logo' | 'gallery' | 'cover' | 'service';

export interface ImageConfig {
  width: number;
  height?: number;
  format: string;
  maxSizeMB: number;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface DeleteResult {
  result: string;
}
