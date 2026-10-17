# Calendar Dashboard

## Production security configuration

The Railway backend must set `NODE_ENV=production`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`,
`FRONTEND_ORIGIN`, `OWNER_GOOGLE_EMAIL`, `ALLOWED_GOOGLE_EMAILS`, and a unique random
`JWT_SECRET` containing at least 32 characters. `FRONTEND_ORIGIN` must be the exact Cloudflare
frontend origin without a trailing slash. Keep `ALLOWED_GOOGLE_EMAILS` restricted to explicitly
approved Google accounts.

Run `npx prisma migrate deploy` during deployment so security-related schema migrations are applied.
Use Railway's private database connection where available, require TLS for external connections,
and keep the PostgreSQL service off the public network unless access is explicitly needed.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

Node.js has to be installed and has to be added to PATH.\
Docker and wsl need to be installed\
Docker is turned on by: \
&nbsp;&nbsp;&nbsp;&nbsp; docker compose up\
Turning on frontend: \
&nbsp;&nbsp;&nbsp;&nbsp;cd frontend/  
&nbsp;&nbsp;&nbsp;&nbsp;npm run dev\
Turning on backend: \
&nbsp;&nbsp;&nbsp;&nbsp;cd backend/\
&nbsp;&nbsp;&nbsp;&nbsp;npm run dev\
In order to run the database scheme, .env file needs to be created in backend with: DATABASE_URL="postgresql://dashboard:dashboard_dev_password@localhost:5432/personal_dashboard?schema=public"\
When in backend, set up the database, run:\
&nbsp;&nbsp;&nbsp;&nbsp;npx prisma generate\
&nbsp;&nbsp;&nbsp;&nbsp;npx prisma migrate deploy\
&nbsp;&nbsp;&nbsp;&nbsp;(optional) npx prisma studio\
