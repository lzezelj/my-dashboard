export const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const canonicalOrigin = (import.meta.env.VITE_CANONICAL_ORIGIN ?? '').replace(/\/$/, '');
