# Dashboard backend on Hetzner

Frontend stays at https://calendar.lzezelj.com on Cloudflare. Proposed API origin:
https://calendar-api.lzezelj.com. Server is ARM64 Ubuntu; images build natively.
These files must be committed and pushed before cloning/pulling them on the server.
No server changes have been performed by preparing these files.

## 1. Clone and configure

```bash
cd /home/lc/apps
git clone https://github.com/lzezelj/my-dashboard.git calendar
cd /home/lc/apps/calendar
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
nano .env.production
```

Use the generated password in both database settings. Copy dashboard auth settings
from Railway. LC credentials and LC's .env.production are separate.
Keep Google's Authorized JavaScript origin https://calendar.lzezelj.com.
This application verifies Google ID tokens; it has no backend OAuth redirect route.

## 2. Prepare networking and images

```bash
sudo docker network create calendar-proxy
sudo docker compose --env-file .env.production -f compose.production.yaml config --quiet
sudo docker compose --env-file .env.production -f compose.production.yaml build calendar-api calendar-migrate
sudo docker compose --env-file .env.production -f compose.production.yaml up -d calendar-postgres
```

If calendar-proxy already exists, inspect it rather than recreating it.
No service in this project publishes host ports. Only the API joins the proxy network.
The database has a dedicated project volume and an internal network.

## 3. Move existing data before starting the API

Pause Railway dashboard API writes (stop its backend service) for the final dump.
Keep Railway's database running. The source was verified as PostgreSQL 18.6,
with 22 users and 211 events before the migration. Use PostgreSQL 18 pg_dump
and restore into this project's separate PostgreSQL 18 container. LC stays on 17.
The PostgreSQL 18 volume mounts at /var/lib/postgresql, as required by that image.
Use this configuration with a fresh dashboard volume; do not point PostgreSQL 18
at a volume initialized by PostgreSQL 17.
Recheck source counts at the final dump if writes have occurred since verification.
Do not use the repository's local-development backup script for Railway.

Transfer that dump securely to /home/lc/apps/calendar/railway.dump, then:

```bash
cd /home/lc/apps/calendar
sudo docker compose --env-file .env.production -f compose.production.yaml exec -T calendar-postgres pg_restore --username=calendar --dbname=calendar --no-owner --no-privileges --exit-on-error < railway.dump
sudo docker compose --env-file .env.production -f compose.production.yaml run --rm calendar-migrate
sudo docker compose --env-file .env.production -f compose.production.yaml up -d calendar-api
sudo docker compose --env-file .env.production -f compose.production.yaml ps
```

Restore only into the fresh calendar database. Do not repeat a partially failed restore
without inspecting it. A fresh empty deployment can skip the dump/restore step.
The health endpoint checks HTTP availability, not database connectivity; verify
authenticated reads and writes after cutover as well.

## 4. Add the proxy network to LC's Compose configuration

In /home/lc/apps/lc/compose.production.yaml, keep caddy's existing backend network
and add calendar-proxy to that service:

```yaml
services:
  caddy:
    # Keep every existing setting, including backend membership.
    networks:
      - backend
      - calendar-proxy

networks:
  # Keep the existing backend declaration.
  calendar-proxy:
    external: true
    name: calendar-proxy
```

This is a partial patch, not a replacement Compose file. For the running Caddy,
attach the network without restarting it:

```bash
sudo docker network connect calendar-proxy lc-production-caddy-1
```

Persisting membership in LC's Compose file ensures future Caddy recreation keeps it.
Do not run LC compose down. No LC service recreation is required now.

## 5. Add the Caddy route

Keep all three existing routes. Append this to LC's Caddyfile.production:

```caddy
calendar-api.lzezelj.com {
    reverse_proxy calendar-api:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

The backend currently trusts X-Real-IP for rate limits. Overwriting it at Caddy
prevents a browser from supplying an arbitrary value. With Cloudflare proxying,
this conservative setup limits by Cloudflare edge IP, so users can share a bucket.
Individual visitor limits require a separate, verified Cloudflare trusted-proxy setup;
do not blindly trust a client-supplied CF-Connecting-IP header.

Create a Cloudflare A record calendar-api pointing to the server's public IPv4,
with proxying enabled. Do not change calendar's frontend record or any LC records.
Keep turn.lzezelj.com DNS only. Use Full (strict) TLS for the API's origin connection;
inspect existing zone settings before changing any zone-wide setting.

Validate the file and gracefully reload:

```bash
sudo docker exec lc-production-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo docker exec lc-production-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
curl -fsS https://calendar-api.lzezelj.com/api/health
```

If the edited bind-mounted file is not visible inside Caddy (some editors replace
the inode), stop and inspect the mount before reloading. LC's Caddy already uses
a single-file bind mount. Do not restart the whole LC stack to work around this.

## 6. Switch the Cloudflare frontend

Set VITE_API_URL=https://calendar-api.lzezelj.com and retain
VITE_CANONICAL_ORIGIN=https://calendar.lzezelj.com. Rebuild/redeploy the frontend.
Keep the existing Google client ID and other frontend settings.
Check Google login, demo login if used, event reads/create/edit/delete, and imports.
Check LC login, signaling and voice after reloading Caddy.

Keep Railway data until validation and an independent database restore test pass.
Do not let both backends accept writes after migrating. Rolling back after new writes
on Hetzner requires transferring those writes back first, not just switching the URL.

## Operations

Before future releases, make a database dump and copy it off the server. Hetzner
server backups complement PostgreSQL logical backups and restore tests. Build
sequentially to preserve memory headroom on the 3.7 GiB server. Check df -h / and
sudo docker system df before releases; no build-cache cleanup is required currently.

For dashboard updates, pull in /home/lc/apps/calendar, rebuild the two images, run
calendar-migrate, then run up -d calendar-api. LC remains its own Compose project.
Never use down -v on either project unless intentionally deleting that project's data.
