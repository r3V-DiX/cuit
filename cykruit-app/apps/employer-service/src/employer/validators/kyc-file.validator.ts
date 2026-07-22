// apps/employer-service/src/employer/validators/kyc-file.validator.ts

import { FileValidator } from '@nestjs/common';
import { matchesMagicBytes } from '@cykruit/upload';

/**
 * Validates that an uploaded KYC file is a PDF or an image (JPEG/JPG/PNG).
 * Mirrors the UPLOAD_CONFIGS.KYC_DOCUMENT allowedMimeTypes definition.
 */
export class KycFileValidator extends FileValidator {
    private static readonly ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
    ] as const;

    private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png'];

    constructor() {
        super({});
    }

    isValid(file: Express.Multer.File): boolean {
        if (!file) return false;
        const mimeOk = (KycFileValidator.ALLOWED_MIME_TYPES as readonly string[]).includes(
            file.mimetype,
        );
        const extOk = KycFileValidator.ALLOWED_EXTENSIONS.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext),
        );
        return mimeOk && extOk && matchesMagicBytes(file.buffer, file.mimetype);
    }

    buildErrorMessage(): string {
        return 'KYC document must be a PDF, JPEG, JPG, or PNG file.';
    }
}
