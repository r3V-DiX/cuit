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
      seekerPhotos: process.env.S3_SEEKER_PHOTOS,
      resumes: process.env.S3_RESUMES,
      certifications: process.env.S3_JOBSEEKER_CERTIFICATIONS,
      companyLogos: process.env.S3_COMPANY_LOGOS,
      companyBanners: process.env.S3_COMPANY_BANNER,
      kycDocuments: process.env.S3_KYC_DOCUMENTS,
      companyMediaImages: process.env.S3_COMPANY_MEDIA,
    },
  },
  defaultMaxSizeInMB: 5,
}));
