// admin-ui/lib/index.ts
// permissions-context.tsx ('use client' provider/hook) is intentionally NOT
// re-exported here — it stays a direct import so this barrel is safe for
// server components to pull types/api from.

export * from './api';
export * from './permissions';
export * from './types';
