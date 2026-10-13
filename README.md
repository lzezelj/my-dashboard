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

## Unified events and staged ownership

The `20261013120000_unified_event_staged` migration copies every legacy Todo, Movie, TV show, Game, Birthday, and Appointment into the unified `Event` table before removing the old tables. It does not reset the database.

`Event.userId` is intentionally nullable until Google authentication is added. Until then, the API has no authenticated identity to scope queries or mutations, so it is not a secure multi-user deployment. When authentication is available, add middleware that derives the user ID from the verified session, pass it to the event services, backfill legacy events to their real owners, and only then make `userId` required in a follow-up migration.
