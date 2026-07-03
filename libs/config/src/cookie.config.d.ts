import type { CookieOptions } from 'express';
export declare class CookieConfig {
    static getSessionCookieOptions(rememberMe?: boolean): CookieOptions;
    static getClearCookieOptions(): CookieOptions;
    static getCsrfCookieOptions(): CookieOptions;
    static getClearCsrfCookieOptions(): CookieOptions;
    static readonly COOKIE_NAMES: {
        readonly SESSION: "session_token";
        readonly REFRESH: "refresh_token";
        readonly CSRF: "csrf_token";
    };
}
