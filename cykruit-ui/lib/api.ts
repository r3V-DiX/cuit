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

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

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
    // Call logout first so the server clears the httpOnly session_token cookie.
    // Without this, the proxy sees session_token still present and redirects /login
    // back to the protected route, creating an infinite loop.
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // best-effort — proceed to redirect regardless
    }
    document.cookie = 'user_role=; Max-Age=0; path=/';
    document.cookie = 'csrf_token=; Max-Age=0; path=/';
    window.location.replace('/login');
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
