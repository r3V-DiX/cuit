// libs/upload/upload.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("upload", () => ({
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // Names match the SSM Parameter Store keys actually set up under
    // /cykruit-v2/{env}/backend/ (s3-seeker-photos, s3-resumes, etc.), which
    // the recursive build-env.sh fetch uppercases into these exact env vars.
    buckets: {
      seekerPhotos: process.env.S3_SEEKER_PHOTOS || process.env.AWS_S3_BUCKET_SEEKER_PHOTOS || "cykruit-jobseeker-photos-prod",
      resumes: process.env.S3_RESUMES || process.env.AWS_S3_BUCKET_RESUMES || "cykruit-resumes-prod",
      certifications: process.env.S3_JOBSEEKER_CERTIFICATIONS || process.env.AWS_S3_BUCKET_CERTIFICATIONS || "cykruit-jobseeker-certifications-prod",
      companyLogos: process.env.S3_COMPANY_LOGOS || process.env.AWS_S3_BUCKET_COMPANY_LOGOS || "cykruit-company-logos-prod",
      companyBanners: process.env.S3_COMPANY_BANNER || process.env.AWS_S3_BUCKET_COMPANY_BANNER || "cykruit-company-banner-prod",
      kycDocuments: process.env.S3_KYC_DOCUMENTS || process.env.AWS_S3_BUCKET_KYC_DOCUMENTS || "cykruit-kyc-documents-prod",
      companyMediaImages: process.env.S3_COMPANY_MEDIA || process.env.AWS_S3_BUCKET_COMPANY_MEDIA || "cykruit-company-banner-prod",
    },
  },
  driver: process.env.UPLOAD_DRIVER || (process.env.NODE_ENV === "development" ? "local" : "s3"),
  defaultMaxSizeInMB: 5,
}));
