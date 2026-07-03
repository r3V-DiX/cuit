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
exports.AppLogger = void 0;
// libs/logger/logger.service.ts
const common_1 = require("@nestjs/common");
const context_1 = require("@cykruit/context");
let AppLogger = class AppLogger {
    constructor(contextService) {
        this.contextService = contextService;
        this.colors = {
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            reset: '\x1b[0m',
            bold: '\x1b[1m',
            dim: '\x1b[2m',
        };
        const level = process.env.LOG_LEVEL ?? 'log';
        this.logLevels = this.mapLogLevel(level);
    }
    mapLogLevel(level) {
        switch (level) {
            case 'error': return ['error'];
            case 'warn': return ['error', 'warn'];
            case 'log': return ['error', 'warn', 'log'];
            case 'debug': return ['error', 'warn', 'log', 'debug'];
            case 'verbose': return ['error', 'warn', 'log', 'debug', 'verbose'];
            default: return ['error', 'warn', 'log'];
        }
    }
    colorize(text, color) {
        if (process.env.NODE_ENV === 'production')
            return text;
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }
    formatTimestamp() {
        return new Date().toISOString().replace('T', ' ').substring(0, 23);
    }
    getContextInfo() {
        const context = this.contextService.getContext();
        if (!context)
            return '';
        const parts = [];
        if (context.requestId)
            parts.push(`ReqID: ${context.requestId.substring(0, 8)}`);
        if (context.userId)
            parts.push(`User: ${context.userId}`);
        return parts.length > 0 ? ` [${parts.join(' | ')}]` : '';
    }
    formatMessage(level, message, context, color) {
        const timestamp = this.colorize(this.formatTimestamp(), 'cyan');
        const levelStr = this.colorize(`[${level.padEnd(7)}]`, color || 'white');
        const contextStr = context ? this.colorize(`[${context}]`, 'cyan') : '';
        const ctxInfo = this.colorize(this.getContextInfo(), 'magenta');
        return `${timestamp} ${levelStr} ${contextStr}${ctxInfo} ${message}`;
    }
    log(message, context) {
        if (this.logLevels.includes('log')) {
            console.log(this.formatMessage('INFO', message, context, 'green'));
        }
    }
    error(message, trace, context) {
        if (this.logLevels.includes('error')) {
            console.error(this.formatMessage('ERROR', message, context, 'red'));
            if (trace && process.env.NODE_ENV !== 'production') {
                console.error(this.colorize(trace, 'red'));
            }
        }
    }
    warn(message, context) {
        if (this.logLevels.includes('warn')) {
            console.warn(this.formatMessage('WARN', message, context, 'yellow'));
        }
    }
    debug(message, context) {
        if (this.logLevels.includes('debug')) {
            console.log(this.formatMessage('DEBUG', message, context, 'blue'));
        }
    }
    verbose(message, context) {
        if (this.logLevels.includes('verbose')) {
            console.log(this.formatMessage('VERBOSE', message, context, 'magenta'));
        }
    }
    logRequest(method, url, statusCode, responseTime) {
        const arrow = statusCode ? '←' : '→';
        const status = statusCode ? `${statusCode}` : '';
        const time = responseTime ? `${responseTime}ms` : '';
        let color = 'green';
        if (statusCode) {
            if (statusCode >= 500)
                color = 'red';
            else if (statusCode >= 400)
                color = 'yellow';
            else if (statusCode >= 300)
                color = 'cyan';
        }
        const parts = [arrow, method, url];
        if (time)
            parts.push('|', time);
        if (status)
            parts.push('|', this.colorize(status, color));
        console.log(this.formatMessage('HTTP', parts.join(' '), undefined, 'blue'));
    }
};
exports.AppLogger = AppLogger;
exports.AppLogger = AppLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [context_1.RequestContextService])
], AppLogger);
