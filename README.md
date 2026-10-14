# my-dashboard

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
# Personal Dashboard

## Database backups

With the local PostgreSQL Docker service running, create a custom-format backup with:

```powershell
npm.cmd --prefix backend run backup
```

Backups are written to `backups/` and files older than 30 days are removed. Schedule that command once per day in the production host's scheduler. Verify the complete backup and restore path without changing the development database with:

```powershell
npm.cmd --prefix backend run backup:test
```

The restore test creates a uniquely named temporary database, verifies the restored `Event` table, and drops the temporary database in a `finally` block. Production credentials, encrypted off-site storage, monitoring, and the final retention policy must be configured with the eventual hosting provider.
