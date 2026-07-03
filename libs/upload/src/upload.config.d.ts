declare const _default: (() => {
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    buckets: {
      seekerPhotos: string;
      resumes: string;
      certifications: string;
      companyLogos: string;
      companyBanners: string;
      kycDocuments: string;
      companyMediaImages: string;
    };
  };
  defaultMaxSizeInMB: number;
}) &
  import("@nestjs/config").ConfigFactoryKeyHost<{
    aws: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      buckets: {
        seekerPhotos: string;
        resumes: string;
        certifications: string;
        companyLogos: string;
        companyBanners: string;
        kycDocuments: string;
        companyMediaImages: string;
      };
    };
    defaultMaxSizeInMB: number;
  }>;
export default _default;
