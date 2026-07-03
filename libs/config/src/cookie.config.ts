// libs/config/src/cookie.config.ts
// ADDITIONS:
//   + getCsrfCookieOptions() — httpOnly:false so JS can read the CSRF token
//   + getClearCsrfCookieOptions() — for clearing CSRF cookie on logout

import type { CookieOptions } from 'express';

export class CookieConfig {
    // ── Session cookie (httpOnly — JS cannot read, CSRF-safe via double-submit) ──

    static getSessionCookieOptions(rememberMe: boolean = false): CookieOptions {
        const isSecure = process.env.COOKIE_SECURE === 'true';

        return {
            httpOnly: true,
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax',
            maxAge: rememberMe
                ? 30 * 24 * 60 * 60 * 1000  // 30 days
                : 24 * 60 * 60 * 1000,       // 24 hours
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
    }

    static getClearCookieOptions(): CookieOptions {
        const isSecure = process.env.COOKIE_SECURE === 'true';

        return {
            httpOnly: true,
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
    }

    // ── CSRF cookie (httpOnly:false — JS MUST be able to read to send in header) ──
    // This is intentional and correct for the double-submit cookie pattern.
    // An attacker can't read cross-origin cookies (same-origin policy),
    // so they can't forge the x-csrf-token header even if they can see this cookie exists.

    static getCsrfCookieOptions(): CookieOptions {
        const isSecure = process.env.COOKIE_SECURE === 'true';

        return {
            httpOnly: false,       // ← intentionally readable by JS
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours, matches session
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
    }

    static getClearCsrfCookieOptions(): CookieOptions {
        const isSecure = process.env.COOKIE_SECURE === 'true';

        return {
            httpOnly: false,
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
    }

    static readonly COOKIE_NAMES = {
        SESSION: 'session_token',
        REFRESH: 'refresh_token',
        CSRF: 'csrf_token',
    } as const;
}