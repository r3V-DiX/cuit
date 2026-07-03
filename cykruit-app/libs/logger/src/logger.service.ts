// libs/logger/logger.service.ts
import { LoggerService, Injectable, LogLevel } from '@nestjs/common';
import { RequestContextService } from '@cykruit/context';

type LogColor =
    | 'red'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'dim';

@Injectable()
export class AppLogger implements LoggerService {
    private logLevels: LogLevel[];

    private readonly colors = {
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

    constructor(private readonly contextService: RequestContextService) {
        const level = process.env.LOG_LEVEL ?? 'log';
        this.logLevels = this.mapLogLevel(level);
    }

    private mapLogLevel(level: string): LogLevel[] {
        switch (level) {
            case 'error': return ['error'];
            case 'warn': return ['error', 'warn'];
            case 'log': return ['error', 'warn', 'log'];
            case 'debug': return ['error', 'warn', 'log', 'debug'];
            case 'verbose': return ['error', 'warn', 'log', 'debug', 'verbose'];
            default: return ['error', 'warn', 'log'];
        }
    }

    private colorize(text: string, color: LogColor): string {
        if (process.env.NODE_ENV === 'production') return text;
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }

    private formatTimestamp(): string {
        return new Date().toISOString().replace('T', ' ').substring(0, 23);
    }

    private getContextInfo(): string {
        const context = this.contextService.getContext();
        if (!context) return '';

        const parts: string[] = [];
        if (context.requestId) parts.push(`ReqID: ${context.requestId.substring(0, 8)}`);
        if (context.userId) parts.push(`User: ${context.userId}`);

        return parts.length > 0 ? ` [${parts.join(' | ')}]` : '';
    }

    private formatMessage(
        level: string,
        message: string,
        context?: string,
        color?: LogColor,
    ): string {
        const timestamp = this.colorize(this.formatTimestamp(), 'cyan');
        const levelStr = this.colorize(`[${level.padEnd(7)}]`, color || 'white');
        const contextStr = context ? this.colorize(`[${context}]`, 'cyan') : '';
        const ctxInfo = this.colorize(this.getContextInfo(), 'magenta');
        return `${timestamp} ${levelStr} ${contextStr}${ctxInfo} ${message}`;
    }

    log(message: string, context?: string) {
        if (this.logLevels.includes('log')) {
            console.log(this.formatMessage('INFO', message, context, 'green'));
        }
    }

    error(message: string, trace?: string, context?: string) {
        if (this.logLevels.includes('error')) {
            console.error(this.formatMessage('ERROR', message, context, 'red'));
            if (trace && process.env.NODE_ENV !== 'production') {
                console.error(this.colorize(trace, 'red'));
            }
        }
    }

    warn(message: string, context?: string) {
        if (this.logLevels.includes('warn')) {
            console.warn(this.formatMessage('WARN', message, context, 'yellow'));
        }
    }

    debug(message: string, context?: string) {
        if (this.logLevels.includes('debug')) {
            console.log(this.formatMessage('DEBUG', message, context, 'blue'));
        }
    }

    verbose(message: string, context?: string) {
        if (this.logLevels.includes('verbose')) {
            console.log(this.formatMessage('VERBOSE', message, context, 'magenta'));
        }
    }

    logRequest(
        method: string,
        url: string,
        statusCode?: number,
        responseTime?: number,
    ) {
        const arrow = statusCode ? '←' : '→';
        const status = statusCode ? `${statusCode}` : '';
        const time = responseTime ? `${responseTime}ms` : '';

        let color: LogColor = 'green';
        if (statusCode) {
            if (statusCode >= 500) color = 'red';
            else if (statusCode >= 400) color = 'yellow';
            else if (statusCode >= 300) color = 'cyan';
        }

        const parts = [arrow, method, url];
        if (time) parts.push('|', time);
        if (status) parts.push('|', this.colorize(status, color));

        console.log(this.formatMessage('HTTP', parts.join(' '), undefined, 'blue'));
    }
}