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
