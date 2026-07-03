"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_CONFIGS = exports.FILE_TYPES = exports.BucketType = exports.UploadFolder = void 0;
// libs/upload/types/upload.types.ts
var UploadFolder;
(function (UploadFolder) {
    UploadFolder["PROFILE_IMAGES"] = "profile-images";
    UploadFolder["RESUMES"] = "resumes";
    UploadFolder["CERTIFICATES"] = "certificates";
    UploadFolder["COMPANY_LOGOS"] = "company-logos";
    UploadFolder["COMPANY_BANNERS"] = "company-banners";
    UploadFolder["KYC_DOCUMENTS"] = "kyc-documents";
    UploadFolder["COMPANY_MEDIA_IMAGES"] = "company-media-images";
})(UploadFolder || (exports.UploadFolder = UploadFolder = {}));
var BucketType;
(function (BucketType) {
    BucketType["SEEKER_PHOTOS"] = "seekerPhotos";
    BucketType["RESUMES"] = "resumes";
    BucketType["CERTIFICATIONS"] = "certifications";
    BucketType["COMPANY_LOGOS"] = "companyLogos";
    BucketType["COMPANY_BANNERS"] = "companyBanners";
    BucketType["KYC_DOCUMENTS"] = "kycDocuments";
    BucketType["COMPANY_MEDIA"] = "companyMediaImages";
})(BucketType || (exports.BucketType = BucketType = {}));
exports.FILE_TYPES = {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    IMAGES_AND_PDF: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    CERTIFICATES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
};
exports.UPLOAD_CONFIGS = {
    PROFILE_IMAGE: { folder: UploadFolder.PROFILE_IMAGES, bucket: BucketType.SEEKER_PHOTOS, maxSizeInMB: 5, allowedMimeTypes: exports.FILE_TYPES.IMAGES, makePublic: true },
    RESUME: { folder: UploadFolder.RESUMES, bucket: BucketType.RESUMES, maxSizeInMB: 10, allowedMimeTypes: exports.FILE_TYPES.DOCUMENTS, makePublic: false },
    CERTIFICATE: { folder: UploadFolder.CERTIFICATES, bucket: BucketType.CERTIFICATIONS, maxSizeInMB: 10, allowedMimeTypes: exports.FILE_TYPES.CERTIFICATES, makePublic: false },
    COMPANY_LOGO: { folder: UploadFolder.COMPANY_LOGOS, bucket: BucketType.COMPANY_LOGOS, maxSizeInMB: 5, allowedMimeTypes: exports.FILE_TYPES.IMAGES, makePublic: true },
    COMPANY_BANNER: { folder: UploadFolder.COMPANY_BANNERS, bucket: BucketType.COMPANY_BANNERS, maxSizeInMB: 5, allowedMimeTypes: exports.FILE_TYPES.IMAGES, makePublic: true },
    KYC_DOCUMENT: { folder: UploadFolder.KYC_DOCUMENTS, bucket: BucketType.KYC_DOCUMENTS, maxSizeInMB: 10, allowedMimeTypes: exports.FILE_TYPES.IMAGES_AND_PDF, makePublic: false },
    COMPANY_MEDIA: { folder: UploadFolder.COMPANY_MEDIA_IMAGES, bucket: BucketType.COMPANY_MEDIA, maxSizeInMB: 5, allowedMimeTypes: exports.FILE_TYPES.IMAGES, makePublic: true },
};
