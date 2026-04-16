# ChordRadar Backend Developer Documentation

## 1. Application Overview

### What the application does
ChordRadar is a Node.js REST API for managing guitar chord data and user accounts. It exposes endpoints for:
- Authentication and session management
- Two-factor authentication (TOTP)
- CRUD operations on musical reference data (notations, tunings, grips)
- Chord creation, lookup, update, deletion
- Associating chords with individual users

### Main business purpose
The backend centralizes chord knowledge and user-specific chord collections, supporting both administrative content management and authenticated end-user workflows.

### Environment and platform
- Runtime: Node.js (ES modules)
- API style: JSON over HTTP (Express)
- API docs: OpenAPI + Swagger UI
- Database: MySQL (via mysql2 and Prisma migrations)
- Typical deployment: Linux/Windows server behind HTTP reverse proxy (not required for local development)

### Target users and organizations
- End users: musicians using authenticated features (saved/user chords, 2FA)
- Admin users: platform operators managing users and master data
- Developers: backend/API maintainers and QA engineers

### Typical use cases
- User registration and email verification
- Login/logout with bearer token lifecycle management
- TOTP enrollment, confirmation, QR retrieval, and disable flow
- Admin-managed user lifecycle and status updates
- Querying chord catalog by notation/grip/tuning
- Creating new chords and associating them with users

---

## 2. Developer Environment

### Required software
- Node.js: modern version compatible with ESM and dependencies (Node 20+ recommended)
- npm: bundled with Node.js
- MySQL Server: local or remote instance
- Optional tools:
  - Prisma CLI (invoked through npm scripts)
  - Postman/curl for API testing
  - Nodemon for local hot reload (already in dev dependencies)

### Supported OS
- Windows, macOS, and Linux are all viable
- Current project activity and scripts have been validated on Windows

### Environment variables
The project reads configuration from environment variables (dotenv):

Database and app:
- PORT
- DB_HOST
- DB_USER
- DB_PASS
- DB_NAME
- DATABASE_URL (used by Prisma, format: mysql://user:pass@host:3306/db)

Authentication/session:
- JWT_SECRET
- API_TOKEN_EXPIRATION
- API_TOKEN_EXPIRATION_LONG
- EMAIL_TOKEN_EXPIRATION

Mail and application metadata:
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- HOST
- APP_NAME

### Install dependencies
```bash
npm install
```

### Local database setup
```bash
npm run generate
npm run migrate
npm run seed:chords
# optional
npm run seed:users
```

Or run combined setup:
```bash
npm run db:setup
```

### Run application locally
Development mode:
```bash
npm run dev
```

Production-like mode:
```bash
npm start
```

Default server port is read from PORT, with fallback 3030.

### Available npm scripts
- start: starts API server
- dev: starts API with nodemon
- migrate: runs Prisma dev migrations
- generate: generates Prisma client
- deploy: runs Prisma deploy migrations
- seed:chords: inserts chord seed data
- seed:users: inserts user seed data
- db:setup: generate + migrate + seed chords
- db:backup: creates SQL dump backup file
- test: runs Jest tests
- test:watch: runs Jest in watch mode
- test:verbose: verbose test output
- node_modules:reset: reinstall dependencies from scratch
- cache:clear: clears npm cache
- node_modules:update: checks outdated packages and updates

### Project structure overview
```text
src/
  app.js                 # Express composition and middleware registration
  server.js              # HTTP bootstrap
  config/
    db.js                # mysql2 connection pool
  controllers/           # Route handlers per domain
  middlewares/           # auth, authorization, validation
  models/                # SQL access layer (mysql2)
  routes/                # Endpoint declarations
  schemas/               # Joi validation schemas
  utils/                 # email, TOTP, backup, QR helpers
prisma/
  schema.prisma          # Canonical data model and enums
  migrations/            # SQL migration history
  seeders/               # Seed scripts
docs/
  openapi.yaml           # API contract
tests/
  *.test.js              # Controller-oriented unit tests
```

---

## 3. Data Structure

### Important note about DB engine request
Requested target in this prompt: SQL Server.

Actual implementation in this codebase: MySQL.
- Prisma datasource provider is mysql
- Runtime DB client is mysql2/promise
- Migrations are MySQL DDL

If SQL Server is required later, a migration project (schema, SQL dialect, drivers, and Prisma provider changes) is needed.

### Database type and name
- Type: MySQL
- Logical database name: chord_radar
- Runtime access: mysql2 connection pool
- Migration management: Prisma

### Storage engine and collation
From migration history:
- Character set: utf8mb4
- Collation: utf8mb4_unicode_ci
- Tables are created with DEFAULT CHARACTER SET/COLLATE as above
- Explicit ENGINE clause is not set in migrations (server default engine is used, typically InnoDB)

### Tables and purpose

#### users
Purpose: stores account profile, security state, and preferences.

Columns (high-level):
- id (PK, auto increment)
- user_name, first_name, last_name
- email_address (unique)
- email_verified (boolean)
- password_hash, password_changed_at
- two_factor_enabled, two_factor_method, two_factor_secret, two_factor_backup
- role (enum: user, admin)
- status (enum: active, pending, suspended)
- account_created_at, last_login_at
- preferences (JSON)

Indexes and keys:
- Primary key: id
- Unique index: users_email_address_key on email_address

#### user_tokens
Purpose: persisted token records for email verification, password reset, and api access sessions.

Columns:
- id (PK)
- user_id (FK -> users.id)
- token
- type (enum: email_verification, password_reset, api_access)
- created_at
- expires_at

Indexes and keys:
- Primary key: id
- Foreign key: user_tokens_user_id_fkey

#### notations
Purpose: dictionary of chord notation labels.

Columns:
- id (PK)
- value (unique)

Indexes and keys:
- Primary key: id
- Unique index: notations_value_key

#### tunings
Purpose: dictionary of tuning names/codes.

Columns:
- id (PK)
- value (unique)

Indexes and keys:
- Primary key: id
- Unique index: tunings_value_key

#### grips
Purpose: dictionary of grip/fingering string patterns.

Columns:
- id (PK)
- strings (unique)

Indexes and keys:
- Primary key: id
- Unique index: grips_strings_key

#### chords
Purpose: canonical chord entity composed from notation, tuning, and grip references.

Columns:
- id (PK)
- notation_id (FK -> notations.id)
- tuning_id (FK -> tunings.id)
- grip_id (FK -> grips.id)

Indexes and keys:
- Primary key: id
- Composite unique index: chords_notation_tuning_grip_uk on (notation_id, tuning_id, grip_id)
- Foreign keys:
  - chords_notation_id_fkey
  - chords_tuning_id_fkey
  - chords_grip_id_fkey

#### user_chord_relations
Purpose: association table linking users to chords in personal collections.

Columns:
- user_id (FK -> users.id)
- chord_id (FK -> chords.id)

Indexes and keys:
- Composite primary key: (user_id, chord_id)
- Unique index: user_chord_relations_user_id_chord_id_key
- Foreign keys:
  - user_chord_relations_user_id_fkey
  - user_chord_relations_chord_id_fkey

### Relationship model
- users 1-to-many user_tokens
- users many-to-many chords via user_chord_relations
- chords many-to-1 notations
- chords many-to-1 tunings
- chords many-to-1 grips

### Referential actions
Current migration state enforces:
- user_tokens.user_id: ON DELETE CASCADE, ON UPDATE CASCADE
- user_chord_relations.user_id: ON DELETE CASCADE, ON UPDATE CASCADE
- user_chord_relations.chord_id: ON DELETE CASCADE, ON UPDATE CASCADE
- chords foreign keys: ON DELETE RESTRICT, ON UPDATE CASCADE

### Data integrity rules
- Unique email per user
- Unique notation/tuning/grip values in lookup tables
- Unique chord triplet (notation_id, tuning_id, grip_id)
- Unique user-chord association per pair
- Validation layer (Joi) enforces input shape/lengths/types before model writes

### ORM/query builder usage
- Runtime query layer: handwritten SQL using mysql2/promise models
- Schema and migration tooling: Prisma (schema.prisma + SQL migrations)

---

## 4. Use Case Model and Roles

### Roles
- Admin
- User
- Guest (unauthenticated client)
- System (internal token/email processing logic)

### Role permissions and responsibilities

Admin:
- Full user administration
- Create/update/delete notations, tunings, grips
- Can patch/delete chords
- Access to admin-protected user endpoints

User:
- Authenticate and maintain session
- Use TOTP endpoints for own account
- Read public catalog endpoints
- Create chords and maintain own chord relations
- Access own user data through selector-based authorization guard

Guest:
- Register account
- Verify email token
- Login (password or TOTP)
- Access public resource reads

System:
- Issues and stores tokens
- Sends verification emails
- Hashes and verifies credentials

### Main use cases by role

Guest:
- POST auth/register
- GET auth/verify
- POST auth/login
- POST auth/login/totp

User:
- POST auth/logout
- POST auth/totp/enroll
- GET auth/totp/qr-code
- POST auth/totp/confirm
- POST auth/totp/disable
- GET api/chords/user-chords
- POST api/chords

Admin:
- GET users
- GET users/:selector/:value
- POST users
- PATCH users/:id
- DELETE users/:id
- POST/PUT/DELETE api/notations
- POST/PUT/DELETE api/tunings
- POST/PUT/DELETE api/grips
- PATCH/DELETE api/chords/:id

### Authentication and authorization flow
1. Client authenticates using credentials or TOTP.
2. Server issues JWT and persists a matching api_access record in user_tokens.
3. Protected routes require:
   - authenticate middleware (JWT verification)
   - requireActiveToken middleware (token exists in DB and belongs to request user)
4. Admin-only routes additionally require requireAdmin.
5. Some user routes use self-or-admin checks by selector to prevent horizontal privilege escalation.

---

## 5. Classes, Modules, and Endpoints

### Core modules and responsibilities
- app.js: Express app composition, CORS, JSON parsing, route mounting, Swagger UI
- server.js: process startup and HTTP listening
- config/db.js: MySQL pool creation
- routes: endpoint definitions and middleware pipelines
- controllers: request orchestration and HTTP responses
- models: SQL statements and transactional DB operations
- middlewares: auth, authorization, validation, hashing utilities
- schemas: Joi contracts for params/query/body
- utils: email delivery, TOTP helpers, QR rendering, DB backup

### Key services and utilities
- TokenModel: token lookup/insert/delete/consume behavior
- UserModel: user CRUD + 2FA storage operations
- ChordModel: transactional chord creation and patching with FK upsert semantics
- sendEmail: SMTP transport abstraction
- totp helpers: secret generation, otpauth URL, token verification, backup code generation

### Middleware usage patterns
- validate: centralized Joi validation for headers/params/query/body
- authenticate: JWT verification
- requireActiveToken: DB-backed token validity check
- requireAdmin: role enforcement
- requireSelfOrAdmin: per-resource ownership/admin authorization
- hashPasswordIfPresent: body normalization/hashing helper

### Endpoint catalog

Base route groups:
- /auth
- /users
- /api/chords
- /api/notations
- /api/tunings
- /api/grips

#### Auth endpoints
- POST /auth/login
  - Body: email_address, password
  - Query: remember-me (optional)
  - 200: token payload
  - Common errors: 400, 401, 403, 500

- POST /auth/login/totp
  - Body: email_address, totp_token
  - Query: remember-me (optional)
  - 200: token payload
  - Common errors: 400, 401, 403, 500

- POST /auth/logout
  - Header: Bearer token
  - 200: logout confirmation
  - Common errors: 401, 404, 500

- POST /auth/register
  - Body: user_name, first_name, last_name, email_address, password, preferences
  - 201: pending user + verification instruction
  - Common errors: 400, 409, 500

- GET /auth/verify
  - Query: token
  - 200: email verified + token
  - Common errors: 400, 500

- POST /auth/totp/enroll
  - Auth required
  - 200: QR data URL + otpauth URL
  - Common errors: 401, 404, 500

- GET /auth/totp/qr-code
  - Auth required
  - 200: image/png
  - Common errors: 401, 404, 500

- POST /auth/totp/confirm
  - Auth required
  - Body: token or code
  - 200: enabled + backup codes
  - Common errors: 400, 401, 404, 422, 500

- POST /auth/totp/disable
  - Auth required
  - Body: one of password, totp_token, backup_code
  - 200: disabled/already disabled
  - Common errors: 400, 401, 404, 500

#### User endpoints
- GET /users
  - Auth + active token + admin
  - 200: list of users
  - Errors: 401, 403, 500

- GET /users/:selector/:value
  - Auth + active token + self-or-admin + param validation
  - selector in {id, email}
  - 200: sanitized user object
  - Errors: 400, 401, 403, 404, 500

- POST /users
  - Auth + active token + admin
  - Body validated (admin style creation flow)
  - 201: created user
  - Errors: 400, 401, 403, 500

- PATCH /users/:id
  - Auth + active token + admin
  - Body allows partial updates for safe fields
  - 200: updated and sanitized user
  - Errors: 400, 401, 403, 404, 409, 500

- DELETE /users/:id
  - Auth + active token + admin
  - 204 on success
  - 404 when user does not exist
  - Errors: 401, 403, 500

#### Chord endpoints
- GET /api/chords
  - Public
  - Optional query field projection
  - 200 array

- GET /api/chords/:id
  - Public + id validation
  - 200 object, 404 if not found

- GET /api/chords/:selector/:selectorValue/tuning/:tuningValue
  - Public + params validation
  - Selector in {notation, grip}
  - 200 array (possibly empty)

- GET /api/chords/user-chords
  - Auth + active token
  - 200 current user chord list

- POST /api/chords
  - Auth + active token
  - 201 create chord; for role=user also creates user_chord_relations row
  - 409 for duplicate chord triplet

- PATCH /api/chords/:id
  - Auth + active token + admin
  - 200 updated chord
  - 404 not found, 409 duplicate, 400 validation

- DELETE /api/chords/:id
  - Auth + active token
  - Admin deletes chord globally
  - Non-admin removes relation to own collection

#### Notation, tuning, and grip endpoints
Pattern is consistent:
- GET list (public)
- GET by id (public)
- POST create (admin)
- PUT update (admin)
- DELETE remove (admin)

Errors include 404 for missing id, 409 for duplicate value, and 500 for unexpected failures.

### Error handling strategy
- Validation middleware returns 400 with error details
- Controllers return domain-specific 404/409 where implemented
- Authentication/authorization middleware returns 401/403
- Unhandled or database errors are returned as 500

### Logical navigation model
There is no UI menu in this backend-only project. Logical navigation is by REST route grouping:
- Auth and session flows under /auth
- User administration under /users
- Musical resources under /api/*

---

## 6. Testing

### Test strategy in repository
Current tests are primarily controller-level unit tests with dependency mocking.
- Unit-style behavior tests for controllers
- Mocked model/service dependencies
- Focus on happy path + error path status codes and payload shapes

### Tooling
- Jest as test framework
- ESM mocking using jest.unstable_mockModule
- Node test environment

### Run tests
```bash
npm test
```

Focused run examples:
```bash
npm test -- userController.test.js --runInBand
npm test -- authController.test.js --runInBand
```

### Existing test coverage areas
- authController
- userController
- chordController
- notationController
- tuningController
- gripController

### Example test cases in codebase
- Login returns 200 and token lifecycle side effects
- Invalid credentials return 401
- User patch returns 404 when target user not found
- User delete returns 404 when id does not exist
- Chord selector behavior returns expected status for invalid selectors

### Test data handling
- No dedicated integration DB fixture pipeline in current Jest tests
- Test doubles/mocks simulate model and utility behavior
- Seeds exist for manual/local environment setup

### Coverage expectations
- No explicit coverage threshold is enforced in Jest config
- Recommended team baseline:
  - Critical auth and authorization paths: high coverage
  - Controller branches and status codes: high coverage
  - Model query integration: add integration tests over time

---

## 7. Future Development Possibilities

### Performance optimizations
- Add selective indexes for frequent query patterns (token lookups, selector filters)
- Introduce pagination for list endpoints
- Avoid repeated lookup queries where joins can return target data directly
- Consider caching read-heavy catalog resources

### Security improvements
- Add centralized rate limiting on auth endpoints
- Add stricter password policy and account lockout behavior
- Normalize error responses to avoid information disclosure
- Store JWT id/metadata and support token revocation lists per device
- Add security headers middleware (helmet) and stricter CORS environment profiles

### New features
- Password reset flow endpoint completion (token generation/consumption UX)
- User profile self-service endpoints (safe subset)
- Chord search enhancements (fuzzy notation filters, tags)
- Audit log for admin actions

### Scalability considerations
- Introduce service/repository layering to decouple HTTP from persistence
- Add background worker for email and asynchronous jobs
- Externalize session/token storage strategy if horizontal scaling grows
- Add observability stack (structured logs, traces, metrics)

### Code quality and refactoring ideas
- Standardize req.validated usage across all controllers
- Unify response shapes and error envelope format
- Remove dead code paths and commented legacy blocks
- Add strict linting/formatting and pre-commit checks
- Consolidate duplicated validation logic

### DevOps and CI/CD enhancements
- Add CI pipeline for:
  - install
  - lint
  - test
  - migration checks
- Add containerized local environment (API + MySQL)
- Add environment-specific config validation at startup
- Automate OpenAPI drift checks against route/controller behavior

---

## Reference Files
- Application wiring: src/app.js, src/server.js
- Database config: src/config/db.js
- Data model: prisma/schema.prisma
- Migration history: prisma/migrations/
- API contract: docs/openapi.yaml
- Route modules: src/routes/
- Controller modules: src/controllers/
- Model modules: src/models/
- Validation/auth middleware: src/middlewares/
- Tests: tests/