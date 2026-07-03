"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
// libs/upload/upload.service.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const upload_types_1 = require("./types/upload.types");
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.privateBuckets = new Set([
            upload_types_1.BucketType.RESUMES,
            upload_types_1.BucketType.CERTIFICATIONS,
            upload_types_1.BucketType.KYC_DOCUMENTS,
        ]);
        const awsConfig = this.configService.get('upload.aws');
        this.s3Client = new client_s3_1.S3Client({
            region: awsConfig.region,
            credentials: {
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey,
            },
        });
        this.buckets = awsConfig.buckets;
        this.defaultMaxSizeInMB = this.configService.get('upload.defaultMaxSizeInMB', 5);
    }
    async uploadFile(file, options) {
        this.validateFile(file, options);
        const bucketName = this.buckets[options.bucket];
        if (!bucketName)
            throw new common_1.BadRequestException(`Bucket config missing: ${options.bucket}`);
        const fileExtension = path.extname(file.originalname);
        const key = `${options.folder}/${(0, uuid_1.v4)()}${fileExtension}`;
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({ Bucket: bucketName, Key: key, Body: file.buffer, ContentType: file.mimetype }));
            const region = this.configService.get('upload.aws.region');
            const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
            return { fileUrl, fileName: file.originalname, fileSize: file.size, fileType: file.mimetype, key, bucket: bucketName };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to upload: ${error.message}`);
        }
    }
    async deleteFile(options) {
        const bucketName = this.buckets[options.bucket];
        if (!bucketName)
            throw new common_1.BadRequestException(`Bucket config missing: ${options.bucket}`);
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucketName, Key: options.key }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to delete: ${error.message}`);
        }
    }
    async getPresignedUrl(key, bucketType, expiresIn = 3600) {
        const bucketName = this.buckets[bucketType];
        if (!bucketName)
            throw new common_1.BadRequestException(`Bucket config missing: ${bucketType}`);
        const command = new client_s3_1.GetObjectCommand({ Bucket: bucketName, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
    }
    isPrivateBucket(bucketType) {
        return this.privateBuckets.has(bucketType);
    }
    async convertToPresignedUrl(fileUrl, expiresIn = 3600) {
        if (!fileUrl)
            return null;
        if (!this.isValidUrl(fileUrl))
            return fileUrl;
        try {
            const bucketType = this.getBucketTypeFromUrlSafe(fileUrl);
            if (!bucketType || !this.isPrivateBucket(bucketType))
                return fileUrl;
            const key = this.extractKeyFromUrlSafe(fileUrl);
            if (!key)
                return fileUrl;
            return await this.getPresignedUrl(key, bucketType, expiresIn);
        }
        catch {
            return fileUrl;
        }
    }
    async transformFileUrls(data, expiresIn = 3600) {
        if (!data)
            return data;
        if (data instanceof Date)
            return data;
        if (Array.isArray(data)) {
            return Promise.all(data.map((item) => this.transformFileUrls(item, expiresIn)));
        }
        if (typeof data === 'object') {
            const transformed = {};
            for (const [key, value] of Object.entries(data)) {
                if (value instanceof Date) {
                    transformed[key] = value;
                }
                else if (this.isFileUrlField(key) && typeof value === 'string') {
                    transformed[key] = await this.convertToPresignedUrl(value, expiresIn);
                }
                else if (typeof value === 'object' && value !== null) {
                    transformed[key] = await this.transformFileUrls(value, expiresIn);
                }
                else {
                    transformed[key] = value;
                }
            }
            return transformed;
        }
        return data;
    }
    isFileUrlField(fieldName) {
        const fileUrlFields = ['fileUrl', 'certificateFile', 'documentUrl', 'profileImage', 'companyLogo', 'resumeUrl'];
        return fileUrlFields.includes(fieldName) || fieldName.endsWith('Url') || fieldName.endsWith('File');
    }
    isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        }
        catch {
            return false;
        }
    }
    validateFile(file, options) {
        const maxBytes = (options.maxSizeInMB || this.defaultMaxSizeInMB) * 1024 * 1024;
        if (file.size > maxBytes)
            throw new common_1.BadRequestException(`File exceeds ${options.maxSizeInMB}MB`);
        if (!options.allowedMimeTypes?.length)
            throw new common_1.BadRequestException('allowedMimeTypes required');
        if (!options.allowedMimeTypes.includes(file.mimetype))
            throw new common_1.BadRequestException(`Invalid type. Allowed: ${options.allowedMimeTypes.join(', ')}`);
    }
    extractKeyFromUrlSafe(fileUrl) {
        try {
            return new URL(fileUrl).pathname.substring(1);
        }
        catch {
            return null;
        }
    }
    extractKeyFromUrl(fileUrl) {
        try {
            return new URL(fileUrl).pathname.substring(1);
        }
        catch {
            throw new common_1.BadRequestException('Invalid file URL');
        }
    }
    extractBucketFromUrlSafe(fileUrl) {
        try {
            return new URL(fileUrl).hostname.split('.')[0];
        }
        catch {
            return null;
        }
    }
    extractBucketFromUrl(fileUrl) {
        try {
            return new URL(fileUrl).hostname.split('.')[0];
        }
        catch {
            throw new common_1.BadRequestException('Invalid file URL');
        }
    }
    getBucketTypeFromUrlSafe(fileUrl) {
        const bucketName = this.extractBucketFromUrlSafe(fileUrl);
        if (!bucketName)
            return null;
        for (const [type, name] of Object.entries(this.buckets)) {
            if (name === bucketName)
                return type;
        }
        return null;
    }
    getBucketTypeFromUrl(fileUrl) {
        const bucketName = this.extractBucketFromUrl(fileUrl);
        for (const [type, name] of Object.entries(this.buckets)) {
            if (name === bucketName)
                return type;
        }
        throw new common_1.BadRequestException('Unknown bucket');
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
