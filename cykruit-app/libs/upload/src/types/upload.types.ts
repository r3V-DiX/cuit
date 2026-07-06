// libs/upload/types/upload.types.ts
export enum UploadFolder {
  PROFILE_IMAGES = "profile-images",
  RESUMES = "resumes",
  CERTIFICATES = "certificates",
  COMPANY_LOGOS = "company-logos",
  COMPANY_BANNERS = "company-banners",
  KYC_DOCUMENTS = "kyc-documents",
  COMPANY_MEDIA_IMAGES = "company-media-images",
}

export enum BucketType {
  SEEKER_PHOTOS = "seekerPhotos",
  RESUMES = "resumes",
  CERTIFICATIONS = "certifications",
  COMPANY_LOGOS = "companyLogos",
  COMPANY_BANNERS = "companyBanners",
  KYC_DOCUMENTS = "kycDocuments",
  COMPANY_MEDIA = "companyMediaImages",
}

export interface UploadOptions {
  folder: UploadFolder;
  bucket: BucketType;
  maxSizeInMB?: number;
  allowedMimeTypes: string[] | readonly string[];
  makePublic?: boolean;
}

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  key: string;
  bucket: string;
}

export interface DeleteFileOptions {
  key: string;
  bucket: BucketType;
}

export const FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  IMAGES_AND_PDF: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  CERTIFICATES: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
} as const;

export const UPLOAD_CONFIGS = {
  PROFILE_IMAGE: {
    folder: UploadFolder.PROFILE_IMAGES,
    bucket: BucketType.SEEKER_PHOTOS,
    maxSizeInMB: 5,
    allowedMimeTypes: FILE_TYPES.IMAGES,
    makePublic: true,
  },
  RESUME: {
    folder: UploadFolder.RESUMES,
    bucket: BucketType.RESUMES,
    maxSizeInMB: 10,
    allowedMimeTypes: FILE_TYPES.DOCUMENTS,
    makePublic: false,
  },
  CERTIFICATE: {
    folder: UploadFolder.CERTIFICATES,
    bucket: BucketType.CERTIFICATIONS,
    maxSizeInMB: 10,
    allowedMimeTypes: FILE_TYPES.CERTIFICATES,
    makePublic: false,
  },
  COMPANY_LOGO: {
    folder: UploadFolder.COMPANY_LOGOS,
    bucket: BucketType.COMPANY_LOGOS,
    maxSizeInMB: 5,
    allowedMimeTypes: FILE_TYPES.IMAGES,
    makePublic: true,
  },
  COMPANY_BANNER: {
    folder: UploadFolder.COMPANY_BANNERS,
    bucket: BucketType.COMPANY_BANNERS,
    maxSizeInMB: 5,
    allowedMimeTypes: FILE_TYPES.IMAGES,
    makePublic: true,
  },
  KYC_DOCUMENT: {
    folder: UploadFolder.KYC_DOCUMENTS,
    bucket: BucketType.KYC_DOCUMENTS,
    maxSizeInMB: 10,
    allowedMimeTypes: FILE_TYPES.IMAGES_AND_PDF,
    makePublic: false,
  },
  COMPANY_MEDIA: {
    folder: UploadFolder.COMPANY_MEDIA_IMAGES,
    bucket: BucketType.COMPANY_MEDIA,
    maxSizeInMB: 5,
    allowedMimeTypes: FILE_TYPES.IMAGES,
    makePublic: true,
  },
} as const;
