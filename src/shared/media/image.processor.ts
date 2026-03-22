import sharp from 'sharp';

export async function processImage(buffer: Buffer, config) {
  let img = sharp(buffer);

  if (config.width || config.height) {
    img = img.resize(config.width, config.height);
  }

  if (config.format) {
    img = img.toFormat(config.format);
  }

  return await img.toBuffer();
}
