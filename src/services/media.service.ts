import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Request } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../config/s3.js';
import { env } from '../config/env.js';

// ─── Return shapes ────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function uploadImage(
  file: NonNullable<Request['file']>,
  folder = 'uploads',
): Promise<UploadResult> {
  // Normalise to WebP and cap dimensions at 1200px wide
  const processed = await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const key = `${folder}/${uuidv4()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: processed,
      ContentType: 'image/webp',
    }),
  );

  const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { url, key };
}

export async function deleteImage(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }),
  );
}
