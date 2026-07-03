// libs/upload/upload.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("upload", () => ({
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    buckets: {
      seekerPhotos: process.env.AWS_S3_BUCKET_SEEKER_PHOTOS,
      resumes: process.env.AWS_S3_BUCKET_RESUMES,
      certifications: process.env.AWS_S3_BUCKET_CERTIFICATIONS,
      companyLogos: process.env.AWS_S3_BUCKET_COMPANY_LOGOS,
      companyBanners: process.env.AWS_S3_BUCKET_COMPANY_BANNER,
      kycDocuments: process.env.AWS_S3_BUCKET_KYC_DOCUMENTS,
      companyMediaImages: process.env.AWS_S3_BUCKET_COMPANY_MEDIA,
    },
  },
  defaultMaxSizeInMB: 5,
}));
