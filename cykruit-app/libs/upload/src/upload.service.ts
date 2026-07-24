// libs/upload/upload.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import {
  UploadOptions,
  UploadResult,
  DeleteFileOptions,
  BucketType,
} from "./types/upload.types";
import { matchesMagicBytes } from "./magic-bytes";

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private buckets: Record<BucketType, string>;
  private defaultMaxSizeInMB: number;
  private driver: "local" | "s3";

  private privateBuckets: Set<BucketType> = new Set([
    BucketType.RESUMES,
    BucketType.CERTIFICATIONS,
    BucketType.KYC_DOCUMENTS,
  ]);

  constructor(private configService: ConfigService) {
    this.driver = this.configService.get("upload.driver") || "local";
    const awsConfig = this.configService.get("upload.aws");

    const credentials = awsConfig.accessKeyId && awsConfig.secretAccessKey
      ? { accessKeyId: awsConfig.accessKeyId, secretAccessKey: awsConfig.secretAccessKey }
      : undefined;

    this.s3Client = new S3Client({
      region: awsConfig.region || "us-east-1",
      ...(credentials ? { credentials } : {}),
    });

    this.buckets = awsConfig.buckets;
    this.defaultMaxSizeInMB = this.configService.get(
      "upload.defaultMaxSizeInMB",
      5,
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult> {
    this.validateFile(file, options);

    const bucketName = this.buckets[options.bucket];
    const fileExtension = path.extname(file.originalname);
    const safeFileName = file.originalname
      .replace(/[^a-zA-Z0-9._\-]/g, '_')
      .slice(0, 255);

    if (this.driver === "local") {
      try {
        const uniqueName = `${uuidv4()}${fileExtension}`;
        const relativeKey = `${options.folder}/${uniqueName}`;
        const targetDir = path.join(process.cwd(), "uploads", options.folder);
        fs.mkdirSync(targetDir, { recursive: true });
        const filePath = path.join(targetDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);

        const fileUrl = `/uploads/${relativeKey}`;
        return {
          fileUrl,
          fileName: safeFileName,
          fileSize: file.size,
          fileType: file.mimetype,
          key: relativeKey,
          bucket: bucketName || "local",
        };
      } catch (error) {
        throw new BadRequestException(`Failed to upload locally: ${error.message}`);
      }
    }

    if (!bucketName)
      throw new BadRequestException(`Bucket config missing: ${options.bucket}`);

    const key = `${options.folder}/${uuidv4()}${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const region = this.configService.get("upload.aws.region");
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      return {
        fileUrl,
        fileName: safeFileName,
        fileSize: file.size,
        fileType: file.mimetype,
        key,
        bucket: bucketName,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload: ${error.message}`);
    }
  }

  async deleteFile(options: DeleteFileOptions): Promise<void> {
    if (this.driver === "local") {
      const localPath = path.join(process.cwd(), "uploads", options.key);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch { /* silent */ }
      }
      return;
    }

    const bucketName = this.buckets[options.bucket];
    if (!bucketName)
      throw new BadRequestException(`Bucket config missing: ${options.bucket}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: options.key }),
      );
    } catch (error) {
      throw new BadRequestException(`Failed to delete: ${error.message}`);
    }
  }

  async getPresignedUrl(
    key: string,
    bucketType: BucketType,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (this.driver === "local") {
      return key.startsWith("/") ? key : `/uploads/${key}`;
    }

    const bucketName = this.buckets[bucketType];
    if (!bucketName)
      throw new BadRequestException(`Bucket config missing: ${bucketType}`);

    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  isPrivateBucket(bucketType: BucketType): boolean {
    return this.privateBuckets.has(bucketType);
  }

  async convertToPresignedUrl(
    fileUrl: string | null | undefined,
    expiresIn: number = 3600,
  ): Promise<string | null> {
    if (!fileUrl) return null;
    if (!this.isValidUrl(fileUrl)) return fileUrl;

    try {
      const bucketType = this.getBucketTypeFromUrlSafe(fileUrl);
      if (!bucketType || !this.isPrivateBucket(bucketType)) return fileUrl;

      const key = this.extractKeyFromUrlSafe(fileUrl);
      if (!key) return fileUrl;

      return await this.getPresignedUrl(key, bucketType, expiresIn);
    } catch {
      return fileUrl;
    }
  }

  async transformFileUrls<T>(data: T, expiresIn: number = 3600): Promise<T> {
    if (!data) return data;
    if (data instanceof Date) return data;

    if (Array.isArray(data)) {
      return Promise.all(
        data.map((item) => this.transformFileUrls(item, expiresIn)),
      ) as Promise<T>;
    }

    if (typeof data === "object") {
      const transformed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
          transformed[key] = value;
        } else if (this.isFileUrlField(key) && typeof value === "string") {
          transformed[key] = await this.convertToPresignedUrl(value, expiresIn);
        } else if (typeof value === "object" && value !== null) {
          transformed[key] = await this.transformFileUrls(value, expiresIn);
        } else {
          transformed[key] = value;
        }
      }
      return transformed as T;
    }

    return data;
  }

  private isFileUrlField(fieldName: string): boolean {
    const fileUrlFields = [
      "fileUrl",
      "certificateFile",
      "documentUrl",
      "profileImage",
      "companyLogo",
      "resumeUrl",
    ];
    return (
      fileUrlFields.includes(fieldName) ||
      fieldName.endsWith("Url") ||
      fieldName.endsWith("File")
    );
  }

  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  private validateMagicBytes(buffer: Buffer, mimetype: string): void {
    if (!matchesMagicBytes(buffer, mimetype)) {
      throw new BadRequestException(`File content does not match declared type ${mimetype}`);
    }
  }

  private validateFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): void {
    const maxBytes =
      (options.maxSizeInMB || this.defaultMaxSizeInMB) * 1024 * 1024;
    if (file.size > maxBytes)
      throw new BadRequestException(`File exceeds ${options.maxSizeInMB}MB`);
    if (!options.allowedMimeTypes?.length)
      throw new BadRequestException("allowedMimeTypes required");
    if (!options.allowedMimeTypes.includes(file.mimetype))
      throw new BadRequestException(
        `Invalid type. Allowed: ${options.allowedMimeTypes.join(", ")}`,
      );
    this.validateMagicBytes(file.buffer, file.mimetype);
  }

  extractKeyFromUrlSafe(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const hostParts = url.hostname.split(".");
      if (hostParts[0] === "s3" || hostParts[0].startsWith("s3-")) {
        const pathParts = url.pathname.split("/").filter(Boolean);
        pathParts.shift();
        return decodeURIComponent(pathParts.join("/"));
      }
      return decodeURIComponent(url.pathname.substring(1));
    } catch {
      return null;
    }
  }

  extractKeyFromUrl(fileUrl: string): string {
    const key = this.extractKeyFromUrlSafe(fileUrl);
    if (!key) throw new BadRequestException("Invalid file URL");
    return key;
  }

  private extractBucketFromUrlSafe(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const hostParts = url.hostname.split(".");
      if (hostParts[0] === "s3" || hostParts[0].startsWith("s3-")) {
        const pathParts = url.pathname.split("/").filter(Boolean);
        return pathParts[0] || null;
      }
      return hostParts[0];
    } catch {
      return null;
    }
  }

  extractBucketFromUrl(fileUrl: string): string {
    const bucket = this.extractBucketFromUrlSafe(fileUrl);
    if (!bucket) throw new BadRequestException("Invalid file URL");
    return bucket;
  }

  private getBucketTypeFromUrlSafe(fileUrl: string): BucketType | null {
    const bucketName = this.extractBucketFromUrlSafe(fileUrl);
    if (!bucketName) return null;
    for (const [type, name] of Object.entries(this.buckets)) {
      if (name === bucketName) return type as BucketType;
    }
    return null;
  }

  getBucketTypeFromUrl(fileUrl: string): BucketType {
    const bucketName = this.extractBucketFromUrl(fileUrl);
    for (const [type, name] of Object.entries(this.buckets)) {
      if (name === bucketName) return type as BucketType;
    }
    throw new BadRequestException("Unknown bucket");
  }
}
