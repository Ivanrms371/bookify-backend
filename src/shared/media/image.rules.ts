export type ImageType = 'avatar' | 'logo' | 'gallery' | 'cover' | 'service';

export function getImageConfig(type: ImageType) {
  switch (type) {
    case 'avatar':
      return {
        width: 200,
        height: 200,
        format: 'webp',
        maxSizeMB: 2,
      };

    case 'logo':
      return {
        width: 300,
        height: 300,
        format: 'webp',
        maxSizeMB: 2,
      };

    case 'cover':
      return {
        width: 1200,
        height: 400,
        format: 'webp',
        maxSizeMB: 5,
      };

    case 'gallery':
      return {
        width: 800,
        format: 'webp',
        maxSizeMB: 5,
      };

    case 'service':
      return {
        width: 400,
        height: 400,
        format: 'webp',
        maxSizeMB: 2,
      };
  }
}

export function validateImage(file: { size: number }, config: { maxSizeMB: number }) {
  if (file.size > config.maxSizeMB * 1024 * 1024) {
    throw new Error('Image too large');
  }
}

export function generateFilePath(businessId: string, type: ImageType) {
  return `${businessId}/${type}/${Date.now()}`;
}
