import { ConfigService } from "@nestjs/config";
import {
  UploadOptions,
  UploadResult,
  DeleteFileOptions,
  BucketType,
} from "./types/upload.types";
export declare class UploadService {
  private configService;
  private s3Client;
  private buckets;
  private defaultMaxSizeInMB;
  private privateBuckets;
  constructor(configService: ConfigService);
  uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult>;
  deleteFile(options: DeleteFileOptions): Promise<void>;
  getPresignedUrl(
    key: string,
    bucketType: BucketType,
    expiresIn?: number,
  ): Promise<string>;
  isPrivateBucket(bucketType: BucketType): boolean;
  convertToPresignedUrl(
    fileUrl: string | null | undefined,
    expiresIn?: number,
  ): Promise<string | null>;
  transformFileUrls<T>(data: T, expiresIn?: number): Promise<T>;
  private isFileUrlField;
  private isValidUrl;
  private validateFile;
  extractKeyFromUrlSafe(fileUrl: string): string | null;
  extractKeyFromUrl(fileUrl: string): string;
  private extractBucketFromUrlSafe;
  extractBucketFromUrl(fileUrl: string): string;
  private getBucketTypeFromUrlSafe;
  getBucketTypeFromUrl(fileUrl: string): BucketType;
}
