"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = void 0;
// libs/common/utils/response-builder.util.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const context_1 = require("@cykruit/context");
let ResponseBuilder = class ResponseBuilder {
    constructor(configService, contextService) {
        this.configService = configService;
        this.contextService = contextService;
        const nodeEnv = this.configService.get('NODE_ENV', 'development');
        const includeMetaInProd = this.configService.get('INCLUDE_META_IN_PRODUCTION', 'false') === 'true';
        this.includeMeta = nodeEnv !== 'production' || includeMetaInProd;
        this.includeRequestId = this.configService.get('INCLUDE_REQUEST_ID', 'true') === 'true';
        this.includeTimestamp = this.configService.get('INCLUDE_TIMESTAMP', 'true') === 'true';
        this.includePath = this.configService.get('INCLUDE_PATH', nodeEnv !== 'production' ? 'true' : 'false') === 'true';
    }
    buildMeta(path) {
        if (!this.includeMeta)
            return undefined;
        const context = this.contextService.getContext();
        const meta = {};
        if (this.includeTimestamp)
            meta.timestamp = new Date().toISOString();
        if (this.includeRequestId && context?.requestId)
            meta.requestId = context.requestId;
        if (this.includePath && path)
            meta.path = path;
        return Object.keys(meta).length === 0 ? undefined : meta;
    }
    success(data, message, path) {
        const response = { success: true, data };
        if (message)
            response.message = message;
        const meta = this.buildMeta(path);
        if (meta)
            response.meta = meta;
        return response;
    }
    paginated(items, pagination, message, path) {
        return this.success({ items, pagination }, message, path);
    }
    warning(data, warningCode, warningMessage, path) {
        const response = {
            success: true,
            data,
            warning: { code: warningCode, message: warningMessage },
        };
        const meta = this.buildMeta(path);
        if (meta)
            response.meta = meta;
        return response;
    }
    info(data, infoCode, infoMessage, path) {
        const response = {
            success: true,
            data,
            info: { code: infoCode, message: infoMessage },
        };
        const meta = this.buildMeta(path);
        if (meta)
            response.meta = meta;
        return response;
    }
    error(code, message, statusCode, path, details) {
        const response = {
            success: false,
            error: { code, message, statusCode, ...(details && { details }) },
        };
        const meta = this.buildMeta(path);
        if (meta)
            response.meta = meta;
        return response;
    }
    buildPaginationMeta(total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }
    shouldIncludeMeta() {
        return this.includeMeta;
    }
};
exports.ResponseBuilder = ResponseBuilder;
exports.ResponseBuilder = ResponseBuilder = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        context_1.RequestContextService])
], ResponseBuilder);
