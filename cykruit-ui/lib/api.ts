export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number, details?: any) {
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

export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  let body: any;
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

  // Check if body is the standard envelope (has a top-level `success` boolean)
  if (body !== null && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      const err = body.error ?? {};
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

    const result: ApiResult<T> = { data: body.data as T };
    if (body.message !== undefined) result.message = body.message;
    if (body.warning !== undefined) result.warning = body.warning;
    if (body.info !== undefined) result.info = body.info;
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
