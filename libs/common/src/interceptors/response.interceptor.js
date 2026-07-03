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
exports.ResponseInterceptor = void 0;
// libs/common/interceptors/response.interceptor.ts
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const response_builder_util_1 = require("../utils/response-builder.util");
let ResponseInterceptor = class ResponseInterceptor {
    constructor(responseBuilder) {
        this.responseBuilder = responseBuilder;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, operators_1.map)((data) => {
            if (data === null || data === undefined)
                return this.responseBuilder.success(null, undefined, request.url);
            if (typeof data === "object" && "success" in data)
                return data;
            if (this.isMessageOnly(data))
                return this.responseBuilder.success(null, data.message, request.url);
            if (this.isWarningOnly(data))
                return this.responseBuilder.warning(null, data.warning.code, data.warning.message, request.url);
            if (this.isWarningResponse(data))
                return this.responseBuilder.warning(data.data, data.warning.code, data.warning.message, request.url);
            if (this.isInfoResponse(data))
                return this.responseBuilder.info(data.data, data.info.code, data.info.message, request.url);
            if (this.isRawObjectWithInfo(data)) {
                const { info, ...rest } = data;
                return this.responseBuilder.info(rest, info.code, info.message, request.url);
            }
            if (this.isMessageResponse(data))
                return this.responseBuilder.success(data.data, data.message, request.url);
            return this.responseBuilder.success(data, undefined, request.url);
        }));
    }
    isMessageOnly(data) {
        return (typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof data.message === "string" &&
            !("data" in data) &&
            !("warning" in data) &&
            !("info" in data));
    }
    isWarningOnly(data) {
        return (typeof data === "object" &&
            data !== null &&
            "warning" in data &&
            typeof data.warning === "object" &&
            "code" in data.warning &&
            "message" in data.warning &&
            !("data" in data));
    }
    isWarningResponse(data) {
        return (typeof data === "object" &&
            data !== null &&
            "data" in data &&
            "warning" in data &&
            typeof data.warning === "object" &&
            "code" in data.warning &&
            "message" in data.warning);
    }
    isInfoResponse(data) {
        return (typeof data === "object" &&
            data !== null &&
            "data" in data &&
            "info" in data &&
            typeof data.info === "object" &&
            "code" in data.info &&
            "message" in data.info);
    }
    isRawObjectWithInfo(data) {
        return (typeof data === "object" &&
            data !== null &&
            "info" in data &&
            typeof data.info === "object" &&
            "code" in data.info &&
            "message" in data.info &&
            !("data" in data) &&
            !("warning" in data));
    }
    isMessageResponse(data) {
        return (typeof data === "object" &&
            data !== null &&
            "data" in data &&
            "message" in data &&
            typeof data.message === "string" &&
            !("warning" in data) &&
            !("info" in data));
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [response_builder_util_1.ResponseBuilder])
], ResponseInterceptor);
