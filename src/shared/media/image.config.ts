import { ImageConfig, ImageType } from './types';

export const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
  avatar: { width: 200, height: 200, format: 'webp', maxSizeMB: 2 },
  logo: { width: 300, height: 300, format: 'webp', maxSizeMB: 2 },
  cover: { width: 1200, height: 400, format: 'webp', maxSizeMB: 5 },
  gallery: { width: 800, format: 'webp', maxSizeMB: 5 },
  service: { width: 400, height: 400, format: 'webp', maxSizeMB: 2 },
};
