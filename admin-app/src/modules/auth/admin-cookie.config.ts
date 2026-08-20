// admin-app/src/modules/auth/admin-cookie.config.ts
// Shared cookie-option builders for admin_session_token / admin_csrf_token so
// every set/clear call uses identical httpOnly/secure/sameSite/path — clearing
// with mismatched options is the exact bug class this file exists to prevent.

import type { CookieOptions } from 'express';

function isProductionEnv(nodeEnv: string | undefined): boolean {
    return nodeEnv === 'production';
}

export function getAdminSessionCookieOptions(nodeEnv: string | undefined, expires?: Date): CookieOptions {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionEnv(nodeEnv),
        path: '/',
        ...(expires ? { expires } : {}),
    };
}

export function getAdminClearSessionCookieOptions(nodeEnv: string | undefined): CookieOptions {
    return getAdminSessionCookieOptions(nodeEnv);
}

export function getAdminCsrfCookieOptions(nodeEnv: string | undefined, expires?: Date): CookieOptions {
    return {
        httpOnly: false,
        sameSite: 'lax',
        secure: isProductionEnv(nodeEnv),
        path: '/',
        ...(expires ? { expires } : {}),
    };
}

export function getAdminClearCsrfCookieOptions(nodeEnv: string | undefined): CookieOptions {
    return getAdminCsrfCookieOptions(nodeEnv);
}
