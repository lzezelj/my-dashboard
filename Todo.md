# Project Roadmap

## Phase 1: Architecture and Database

- [x] Finalize the unified Event schema
- [x] Define event categories, date/time handling, recurrence, and completion
- [x] Create the User model and event ownership relationship
- [x] Apply and test Prisma migrations

## Phase 2: Authentication

- [x] Implement Google sign-in
- [x] Create or retrieve internal user accounts
- [x] Implement secure cookie-based sessions
- [x] Implement logout and session expiration
- [x] Protect API endpoints and enforce user ownership

## Phase 3: Calendar and Events

- [x] Implement event creation, editing, and deletion
- [x] Finish calendar integration
- [x] Handle date-only events and timezones correctly
- [x] Add input validation and error handling
- [x] Implement recurrence when needed

## Phase 4: Data Import and Export

- [x] Implement CSV export
- [x] Implement CSV import with validation and preview
- [x] Handle duplicates and invalid files
- [x] Implement account deletion and data cleanup

## Phase 5: Testing and Security

- [x] Add the backend testing framework and test database configuration
- [x] Test authentication middleware and session handling
- [x] Test that users cannot read, edit, or delete another user’s events
- [x] Test event creation, retrieval, editing, and deletion
- [x] Test individual, selected, and all-event deletion
- [x] Test JSON v2 import and export
- [x] Test ICS parsing, preview, import, export, and malformed files
- [x] Test finite, date-limited, and infinite recurrence
- [x] Test account deletion and cascading data removal
- [x] Test all migrations against a fresh database
- [x] Review request limits, cookie settings, CORS, and input validation
- [x] Configure database backups and test restoration
- [x] Add frontend interaction tests

## Phase 6: Legal and Privacy

- [ ] Research applicable GDPR and TDDDG requirements
- [ ] Prepare the privacy policy and Impressum
- [ ] Review cookies, storage, and third-party services
- [ ] Document data retention, export, and deletion
- [ ] Review hosting and data-processing arrangements

## Phase 7: Deployment

- [ ] Choose a hosting provider
- [ ] Configure the domain and HTTPS
- [ ] Configure production environment variables and secrets
- [ ] Set up production PostgreSQL and migrations
- [ ] Configure logging and error monitoring
- [ ] Deploy and test the live application
- [ ] Update the GitHub README and documentation

## Phase 8: Mobile Applications

- [ ] Evaluate React Native with Expo
- [ ] Build the Android application
- [ ] Test the application on Android devices
- [ ] Evaluate iOS development and release requirements
- [ ] Build and test the iOS application

The main remaining weaknesses are:

1. CSRF protection
   Production cookies use SameSite=None because Railway and Cloudflare are separate sites. State-changing endpoints should additionally verify the request Origin or use CSRF tokens.
2. Security headers
   The backend does not currently use Helmet or equivalent headers such as Content Security Policy, anti-framing protection, and MIME-sniffing protection.
3. Rate-limit bypass/distribution
   The limiter is stored in application memory and trusts X-Real-IP in production. It should use Railway’s verified proxy configuration and, for a larger deployment, a shared Redis-backed store.
4. JWT revocation
   Logging out clears the browser cookie, but a copied token remains valid until its 24-hour expiration. Account deletion limits the practical impact because the user lookup/data access then fails, but proper server-side session revocation would be stronger.
5. Input-size limits
   The total JSON body is capped at 6 MB, but many individual strings and imported arrays do not have strict field/count limits. Large or intentionally complex calendar imports could consume excess CPU or memory.
6. Infrastructure security
   Database TLS, Railway database exposure, credentials, least-privilege database users, backups, and secret rotation must be checked in Railway itself; those guarantees cannot be confirmed from the repository.
