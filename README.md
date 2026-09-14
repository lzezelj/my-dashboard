# my-dashboard
Node.js has to be installed and has to be added to PATH
Docker and wsl need to be installed
Docker is turned on by: docker compose up
Turning on frontend:
    cd frontend/   
    npm run dev
Turning on backend: 
    cd backend/
    npm run dev
In order to run the database scheme, .env file needs to be created in backend with: DATABASE_URL="postgresql://dashboard:dashboard_dev_password@localhost:5432/personal_dashboard?schema=public"
When in backend, set up the database, run:
    npx prisma generate
    npx prisma migrate deploy
    (optional) npx prisma studio