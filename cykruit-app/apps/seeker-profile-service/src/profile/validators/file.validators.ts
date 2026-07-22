// apps/seeker-profile-service/src/profile/validators/file.validators.ts

import { FileValidator } from "@nestjs/common";
import { matchesMagicBytes } from "@cykruit/upload";

export class DocumentFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    if (!file) return false;
    const validMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".doc", ".docx"];
    return (
      validMimeTypes.includes(file.mimetype) &&
      validExtensions.some((ext) =>
        file.originalname.toLowerCase().endsWith(ext),
      ) &&
      matchesMagicBytes(file.buffer, file.mimetype)
    );
  }

  buildErrorMessage(): string {
    return "File must be a valid document (PDF, DOC, or DOCX)";
  }
}
