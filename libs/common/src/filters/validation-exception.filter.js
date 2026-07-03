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
exports.ValidationExceptionFilter = void 0;
// libs/common/filters/validation-exception.filter.ts
const common_1 = require("@nestjs/common");
const logger_1 = require("@cykruit/logger");
const context_1 = require("@cykruit/context");
const response_builder_util_1 = require("../utils/response-builder.util");
const error_codes_1 = require("../enums/error-codes");
let ValidationExceptionFilter = class ValidationExceptionFilter {
    constructor(logger, contextService, responseBuilder) {
        this.logger = logger;
        this.contextService = contextService;
        this.responseBuilder = responseBuilder;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const body = exception.getResponse();
        const errors = this.parseErrors(body);
        const ctx2 = this.contextService.getContext();
        this.logger.warn(`Validation Error: ${request.method} ${request.url} | ${errors.length} error(s) | User: ${ctx2?.userId || "anonymous"}`, "ValidationFilter");
        const errorResponse = this.responseBuilder.error(error_codes_1.ErrorCodes.VALIDATION_ERROR, "Validation failed", status, request.url, errors);
        response.status(status).json(errorResponse);
    }
    parseErrors(body) {
        const errors = [];
        if (Array.isArray(body.message)) {
            body.message.forEach((msg) => {
                if (typeof msg === "string") {
                    errors.push({
                        field: this.extractField(msg),
                        message: msg,
                        constraint: "validation",
                    });
                }
                else if (msg?.property) {
                    Object.entries(msg.constraints || {}).forEach(([key, val]) => {
                        errors.push({
                            field: msg.property,
                            message: val,
                            constraint: key,
                            value: msg.value,
                        });
                    });
                }
            });
        }
        else if (typeof body.message === "string") {
            errors.push({
                field: this.extractField(body.message),
                message: body.message,
                constraint: "validation",
            });
        }
        return errors.length > 0
            ? errors
            : [
                {
                    field: "unknown",
                    message: "Validation failed",
                    constraint: "validation",
                },
            ];
    }
    extractField(message) {
        const match = message.match(/^(\w+)\s/);
        return match ? match[1] : "unknown";
    }
};
exports.ValidationExceptionFilter = ValidationExceptionFilter;
exports.ValidationExceptionFilter = ValidationExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.BadRequestException),
    __metadata("design:paramtypes", [logger_1.AppLogger,
        context_1.RequestContextService,
        response_builder_util_1.ResponseBuilder])
], ValidationExceptionFilter);
