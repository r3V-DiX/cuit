// admin-ui/lib/api.ts
// Thin fetch wrapper: JSON, envelope unwrap ({success, data}), typed ApiError, 401 → /login.
// CSRF token is read from the csrf_token cookie and sent as x-csrf-token on mutations.

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}



interface EnvelopeSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

interface EnvelopeError {
  success: false;
  error?: { message?: string; messages?: string[] };
  message?: string;
}

type Envelope<T> = EnvelopeSuccess<T> | EnvelopeError;

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)admin_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function request<T>(
  url: string,
  init: RequestInit & { skipAuthRedirect?: boolean } = {},
  isRetry: boolean = false,
): Promise<T> {
  const { skipAuthRedirect, ...fetchInit } = init;
  const csrfToken =
    fetchInit.method && MUTATION_METHODS.has(fetchInit.method) ? getCsrfToken() : undefined;

  const res = await fetch(url, {
    ...fetchInit,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(fetchInit.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    if (!skipAuthRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized', 401);
  }

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`HTTP ${res.status}`, res.status);
  }

  if (!body.success) {
    const err = (body as EnvelopeError).error;
    const msg =
      err?.messages?.join(', ') ??
      err?.message ??
      (body as EnvelopeError).message ??
      'An unexpected error occurred';

    // Auto-refresh CSRF token once on 403 / CSRF errors and retry mutation
    if (!isRetry && init.method && MUTATION_METHODS.has(init.method) && (res.status === 403 || msg.toLowerCase().includes('csrf'))) {
      try {
        await fetch('/api/admin/me', { method: 'GET', credentials: 'include' });
        return await request<T>(url, init, true);
      } catch {}
    }

    throw new ApiError(msg, res.status, err);
  }

  return (body as EnvelopeSuccess<T>).data;
}



export const api = {
  get<T>(url: string, init?: RequestInit): Promise<T> {
    return request<T>(url, { ...init, method: 'GET' });
  },

  post<T>(url: string, body?: unknown, init?: RequestInit & { skipAuthRedirect?: boolean }): Promise<T> {
    return request<T>(url, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(url, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(url: string, init?: RequestInit): Promise<T> {
    return request<T>(url, {
      ...init,
      method: 'DELETE',
    });
  },
};
