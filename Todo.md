# Project Roadmap

## Phase 1: Architecture and Database

- [ ] Finalize the unified Event schema
- [ ] Define event categories, date/time handling, recurrence, and completion
- [ ] Create the User model and event ownership relationship
- [ ] Apply and test Prisma migrations

## Phase 2: Authentication

- [ ] Implement Google sign-in
- [ ] Create or retrieve internal user accounts
- [ ] Implement secure cookie-based sessions
- [ ] Implement logout and session expiration
- [ ] Protect API endpoints and enforce user ownership

## Phase 3: Calendar and Events

- [ ] Implement event creation, editing, and deletion
- [ ] Finish calendar integration
- [ ] Handle date-only events and timezones correctly
- [ ] Add input validation and error handling
- [ ] Implement recurrence when needed

## Phase 4: Data Import and Export

- [ ] Implement CSV export
- [ ] Implement CSV import with validation and preview
- [ ] Handle duplicates and invalid files
- [ ] Implement account deletion and data cleanup

## Phase 5: Testing and Security

- [ ] Test authentication and authorization
- [ ] Test that users cannot access other users' data
- [ ] Test event CRUD and CSV import/export
- [ ] Test database migrations on a fresh database
- [ ] Configure database backups and test restoration
- [ ] Add automated tests

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
