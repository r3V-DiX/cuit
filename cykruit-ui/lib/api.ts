export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiResult<T> {
  data: T;
  message?: string;
  warning?: { code: string; message: string };
  info?: { code: string; message: string };
}

let _loggingOut = false;

/**
 * Calls the logout endpoint (with CSRF header so the server can clear the
 * httpOnly session_token cookie), clears the readable cookies client-side,
 * and hard-redirects to /login. Shared by the reactive 401 handler below and
 * the proactive session-expiry auto-logout in use-session-guard.ts.
 */
export async function logoutAndRedirect(): Promise<void> {
  if (_loggingOut) return;
  _loggingOut = true;
  try {
    const csrf = document.cookie
      .split('; ')
      .find((r) => r.startsWith('csrf_token='))
      ?.split('=')[1] ?? '';
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': decodeURIComponent(csrf) },
    });
  } catch {
    // best-effort — proceed to redirect regardless
  }
  document.cookie = 'user_role=; Max-Age=0; path=/';
  document.cookie = 'csrf_token=; Max-Age=0; path=/';
  window.location.replace('/login');
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit & { skipAuthRedirect?: boolean; skipLogoutOn401?: boolean },
): Promise<ApiResult<T>> {
  const { skipAuthRedirect, skipLogoutOn401, ...fetchOptions } = options ?? {};
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
  });

  if (response.status === 401 && skipAuthRedirect) {
    return { data: undefined as unknown as T };
  }

  // When caller opts out of the auto-logout flow (e.g. OTP verify — a 401 means
  // wrong code, not expired session), parse the body and throw like a normal error.
  if (response.status === 401 && skipLogoutOn401) {
    let errBody: unknown;
    try { errBody = await response.json(); } catch { errBody = null; }
    const envelope = (errBody && typeof errBody === 'object' && 'error' in errBody)
      ? (errBody as { error?: { code?: string; message?: string; statusCode?: number } }).error
      : null;
    throw new ApiError(
      envelope?.code ?? 'UNAUTHORIZED',
      envelope?.message ?? 'Unauthorized',
      envelope?.statusCode ?? 401,
    );
  }

  // Reset logout flag on any successful response so future 401s still redirect.
  if (response.ok) {
    _loggingOut = false;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        'PARSE_ERROR',
        `Request failed with status ${response.status}`,
        response.status,
      );
    }
    return { data: undefined as unknown as T };
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    // Deduplicate: if another 401 already triggered logout+redirect, bail out.
    if (_loggingOut) return { data: undefined as unknown as T };
    await logoutAndRedirect();
    return { data: undefined as unknown as T };
  }

  // Check if body is the standard envelope (has a top-level `success` boolean)
  if (body !== null && typeof body === 'object' && 'success' in body) {
    const envelope = body as {
      success: boolean;
      data?: unknown;
      message?: string;
      warning?: { code: string; message: string };
      info?: { code: string; message: string };
      error?: { code?: string; message?: string; statusCode?: number; details?: unknown };
    };
    if (envelope.success === false) {
      const err = envelope.error ?? {};
      throw new ApiError(
        err.code ?? 'UNKNOWN_ERROR',
        err.message ?? 'An unknown error occurred',
        err.statusCode ?? response.status,
        err.details,
      );
    }

    // success === true
    if (!response.ok) {
      // Shouldn't normally happen, but guard anyway
      throw new ApiError(
        'REQUEST_FAILED',
        `Request failed with status ${response.status}`,
        response.status,
      );
    }

    const result: ApiResult<T> = { data: envelope.data as T };
    if (envelope.message !== undefined) result.message = envelope.message;
    if (envelope.warning !== undefined) result.warning = envelope.warning;
    if (envelope.info !== undefined) result.info = envelope.info;
    return result;
  }

  // Not the standard envelope — raw array or plain object
  if (!response.ok) {
    throw new ApiError(
      'REQUEST_FAILED',
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return { data: body as T };
}

export function formatErrorDetails(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const msgs = details.map((d) => (d as { message?: string })?.message).filter(Boolean);
  return msgs.length ? msgs.join(' ') : undefined;
}

export function describeError(err: unknown, fallback: string): { message: string; description?: string } {
  if (err instanceof ApiError) {
    return { message: err.message || fallback, description: formatErrorDetails(err.details) };
  }
  if (err instanceof Error) return { message: err.message || fallback };
  return { message: fallback };
}

export function getCsrf(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='));
  if (!match) return '';
  return decodeURIComponent(match.split('=')[1] ?? '');
}

export function authHeaders(
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': getCsrf(),
    ...extraHeaders,
  };
}
