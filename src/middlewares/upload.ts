import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

const storage = multer.memoryStorage();

function imageFileFilter(
  _req: Request,
  file: NonNullable<Request['file']>,
  cb: FileFilterCallback
): void {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});
