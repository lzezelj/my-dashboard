# Calendar Dashboard

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

The Google account `lovro.zezelj@gmail.com` can manage portfolio demo accounts from **My Account → Demo accounts**. Set `OWNER_GOOGLE_EMAIL` in the backend environment to override the owner address. New demo accounts have empty calendars, use a server-generated one-time password, and can be deleted from the same page.

## Backend tests

Backend tests use a separate local database and never fall back to the development database. Create it once in the running Docker container:

```powershell
docker compose exec -T postgres createdb -U dashboard dashboard_test
Copy-Item backend/.env.test.example backend/.env.test
npm.cmd --prefix backend test
```

Each test run resets only the `public` schema inside `dashboard_test`, applies all migrations, runs the tests, and leaves that test schema empty afterward. Safety checks require a local database whose name contains `test` and reject the development database URL. The local `backend/.env.test` file is ignored by Git.

## API rate limiting

The backend permits 300 API requests and 20 authentication attempts per client IP every 15 minutes by default. These optional backend environment variables override the defaults:

```env
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
```
