import multer from 'multer';
import { BusinessError } from '../utils/error.util.js';

// Configure multer to store uploaded files in memory as buffers
const storage = multer.memoryStorage();

// Allowed image MIME types (validated against magic bytes)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// File filter with magic bytes validation
const fileFilter = async (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  console.log('[UploadMiddleware] Filtering file:', {
    fieldname: file.fieldname,
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  // First check: MIME type from header
  if (!file.mimetype.startsWith('image/')) {
    console.error(
      '[UploadMiddleware] Rejected - not an image MIME type:',
      file.mimetype,
    );
    return cb(new Error('Only image files are allowed'));
  }

  // Allow callback to proceed (magic bytes validation happens in controller)
  cb(null, true);
};

/**
 * Validate file type using magic bytes (not just MIME type)
 * This must be called AFTER multer processes the file
 */
export async function validateImageFile(
  file: Express.Multer.File,
): Promise<void> {
  if (!file.buffer) {
    throw new BusinessError('Invalid file buffer');
  }

  // Read magic bytes to determine actual file type robustly without problematic external libraries
  const buffer = file.buffer;
  let detectedType: { mime: string } | null = null;

  if (buffer.length >= 4) {
    const magic = buffer.toString('hex', 0, 4);
    if (magic === '89504e47') {
      detectedType = { mime: 'image/png' };
    } else if (magic.startsWith('ffd8ff')) {
      detectedType = { mime: 'image/jpeg' };
    } else if (buffer.length >= 12) {
      const webpMagic1 = buffer.toString('hex', 0, 4);
      const webpMagic2 = buffer.toString('hex', 8, 12);
      if (webpMagic1 === '52494646' && webpMagic2 === '57454250') {
        detectedType = { mime: 'image/webp' };
      }
    }
  }

  if (!detectedType) {
    throw new BusinessError(
      'Unable to determine file type or unsupported format',
    );
  }

  console.log('[UploadMiddleware] Detected file type:', detectedType.mime);

  if (!ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
    throw new BusinessError(
      `Invalid file type: ${detectedType.mime}. Only JPEG, PNG, and WebP images are allowed.`,
    );
  }

  // Additional size check
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new BusinessError('File size exceeds 5MB limit');
  }
}

// Configure upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Single file per request
  },
});
