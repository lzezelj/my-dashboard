# Calendar Dashboard

## Production security configuration

The Railway backend must set `NODE_ENV=production`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`,
`FRONTEND_ORIGIN`, `OWNER_GOOGLE_EMAIL`, `ALLOWED_GOOGLE_EMAILS`, and a unique random
`JWT_SECRET` containing at least 32 characters. `FRONTEND_ORIGIN` must be the exact Cloudflare
frontend origin without a trailing slash. Keep `ALLOWED_GOOGLE_EMAILS` restricted to explicitly
approved Google accounts.

The Cloudflare frontend should set `VITE_API_URL` to the Railway backend origin and
`VITE_CANONICAL_ORIGIN` to the custom frontend origin, both without a trailing slash. Requests to
the former `my-dashboard.lovro-zezelj.workers.dev` address are redirected in the browser to the
canonical origin while preserving the path, query string, and fragment.

Run `npx prisma migrate deploy` during deployment so security-related schema migrations are applied.
Use Railway's private database connection where available, require TLS for external connections,
and keep the PostgreSQL service off the public network unless access is explicitly needed.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.
