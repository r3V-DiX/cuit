export declare enum UploadFolder {
  PROFILE_IMAGES = "profile-images",
  RESUMES = "resumes",
  CERTIFICATES = "certificates",
  COMPANY_LOGOS = "company-logos",
  COMPANY_BANNERS = "company-banners",
  KYC_DOCUMENTS = "kyc-documents",
  COMPANY_MEDIA_IMAGES = "company-media-images",
}
export declare enum BucketType {
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
export declare const FILE_TYPES: {
  readonly IMAGES: readonly [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  readonly DOCUMENTS: readonly [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  readonly IMAGES_AND_PDF: readonly [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  readonly CERTIFICATES: readonly [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
};
export declare const UPLOAD_CONFIGS: {
  readonly PROFILE_IMAGE: {
    readonly folder: UploadFolder.PROFILE_IMAGES;
    readonly bucket: BucketType.SEEKER_PHOTOS;
    readonly maxSizeInMB: 5;
    readonly allowedMimeTypes: readonly [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    readonly makePublic: true;
  };
  readonly RESUME: {
    readonly folder: UploadFolder.RESUMES;
    readonly bucket: BucketType.RESUMES;
    readonly maxSizeInMB: 10;
    readonly allowedMimeTypes: readonly [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    readonly makePublic: false;
  };
  readonly CERTIFICATE: {
    readonly folder: UploadFolder.CERTIFICATES;
    readonly bucket: BucketType.CERTIFICATIONS;
    readonly maxSizeInMB: 10;
    readonly allowedMimeTypes: readonly [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    readonly makePublic: false;
  };
  readonly COMPANY_LOGO: {
    readonly folder: UploadFolder.COMPANY_LOGOS;
    readonly bucket: BucketType.COMPANY_LOGOS;
    readonly maxSizeInMB: 5;
    readonly allowedMimeTypes: readonly [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    readonly makePublic: true;
  };
  readonly COMPANY_BANNER: {
    readonly folder: UploadFolder.COMPANY_BANNERS;
    readonly bucket: BucketType.COMPANY_BANNERS;
    readonly maxSizeInMB: 5;
    readonly allowedMimeTypes: readonly [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    readonly makePublic: true;
  };
  readonly KYC_DOCUMENT: {
    readonly folder: UploadFolder.KYC_DOCUMENTS;
    readonly bucket: BucketType.KYC_DOCUMENTS;
    readonly maxSizeInMB: 10;
    readonly allowedMimeTypes: readonly [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    readonly makePublic: false;
  };
  readonly COMPANY_MEDIA: {
    readonly folder: UploadFolder.COMPANY_MEDIA_IMAGES;
    readonly bucket: BucketType.COMPANY_MEDIA;
    readonly maxSizeInMB: 5;
    readonly allowedMimeTypes: readonly [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    readonly makePublic: true;
  };
};
