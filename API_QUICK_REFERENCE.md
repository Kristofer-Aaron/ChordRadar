# ChordRadar API - Quick Reference Guide

**Last Updated:** April 11, 2026  
**Environment:** Development (localhost:3030)

---

## Authentication

### 1. Register New User
```bash
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "email_address": "john@example.com",
    "password": "SecurePassword123",
    "preferences": { "theme": "dark" }
  }'
```

### 2. Verify Email
```bash
# Email contains link like: /auth/verify?token=<64-hex-token>
curl -X GET "http://localhost:3030/auth/verify?token=a1b2c3d4..."
```

### 3. Login with Password
```bash
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": "john@example.com",
    "password": "SecurePassword123"
  }'
# Response: { "ok": true, "token": "eyJhbGc...", "renewed": false }
```

### 4. Setup TOTP Two-Factor
```bash
# Step 1: Enroll
curl -X POST http://localhost:3030/auth/totp/enroll \
  -H "Authorization: Bearer <jwt-token>"

# Step 2: Get QR Code (scan with Google Authenticator)
curl -X GET http://localhost:3030/auth/totp/qr-code \
  -H "Authorization: Bearer <jwt-token>" \
  --output qr-code.png

# Step 3: Confirm TOTP (provide 6-digit code from app)
curl -X POST http://localhost:3030/auth/totp/confirm \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
# Response includes 10 backup codes (save securely!)
```

### 5. Login with TOTP
```bash
curl -X POST http://localhost:3030/auth/login/totp \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": "john@example.com",
    "totp_token": "123456"
  }'
```

### 6. Logout
```bash
curl -X POST http://localhost:3030/auth/logout \
  -H "Authorization: Bearer <jwt-token>"
```

---

## Chord Management

### 1. List All Chords
```bash
# Basic
curl http://localhost:3030/api/chords

# With human-readable values (not IDs)
curl "http://localhost:3030/api/chords?fields={\"notation\":\"value\",\"tuning\":\"value\",\"grip\":\"value\"}"
```

### 2. Get Chord by ID
```bash
curl http://localhost:3030/api/chords/5
```

### 3. Query Chords by Notation/Grip
```bash
# Get all C chords in standard tuning
curl "http://localhost:3030/api/chords/notation/C/tuning/EADGBE"

# Get all chords with specific grip in standard tuning
curl "http://localhost:3030/api/chords/grip/x32010/tuning/EADGBE"
```

### 4. Create Chord (Authenticated User)
```bash
curl -X POST http://localhost:3030/api/chords \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notation": "D",
    "tuning": "EADGBE",
    "grip": "xx0232"
  }'
```

### 5. Get User's Saved Chords
```bash
curl http://localhost:3030/api/chords/user-chords \
  -H "Authorization: Bearer <jwt-token>"
```

### 6. Update Chord (Admin Only)
```bash
curl -X PATCH http://localhost:3030/api/chords/5 \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"grip": "xx0232"}'
```

### 7. Delete Chord (Authenticated User)
```bash
curl -X DELETE http://localhost:3030/api/chords/5 \
  -H "Authorization: Bearer <jwt-token>"
```

---

## User Management (Admin Only)

### 1. List All Users
```bash
curl http://localhost:3030/users \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### 2. Get User by ID
```bash
curl http://localhost:3030/users/id/5 \
  -H "Authorization: Bearer <jwt-token>"
  # Users can only query themselves
```

### 3. Get User by Email
```bash
curl http://localhost:3030/users/email/john@example.com \
  -H "Authorization: Bearer <jwt-token>"
```

### 4. Create User (Admin Only)
```bash
curl -X POST http://localhost:3030/users \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "newuser",
    "first_name": "New",
    "last_name": "User",
    "email_address": "new@example.com",
    "password_hash": "$2b$10$...",  # Bcrypt hash
    "password_changed_at": "2026-04-11T12:00:00Z",
    "preferences": {},
    "role": "user",
    "status": "active"
  }'
```

### 5. Update User (Admin Only)
```bash
curl -X PATCH http://localhost:3030/users/5 \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "status": "suspended"}'
```

### 6. Delete User (Admin Only)
```bash
curl -X DELETE http://localhost:3030/users/5 \
  -H "Authorization: Bearer <admin-jwt-token>"
```

---

## Reference Data (Public)

### Notations
```bash
curl http://localhost:3030/api/notations
# Response: [{"id": 1, "value": "C"}, {"id": 2, "value": "C#"}, ...]
```

### Tunings
```bash
curl http://localhost:3030/api/tunings
# Response: [{"id": 1, "value": "EADGBE"}, {"id": 2, "value": "DADGAD"}, ...]
```

### Grips
```bash
curl http://localhost:3030/api/grips
# Response: [{"id": 1, "strings": "x32010"}, {"id": 2, "strings": "xx0232"}, ...]
```

---

## Common Error Responses

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation failed",
  "details": [
    "email_address must be a valid email",
    "password must be at least 8 characters"
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "code": "TokenExpiredError",
  "message": "jwt expired"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Chord not found"
}
```

### 409 Conflict (Duplicate)
```json
{
  "error": "Chord with this notation, tuning and grip already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Common Request Headers

| Header | Value | Required For |
|--------|-------|--------------|
| Authorization | `Bearer <jwt-token>` | Protected routes |
| Content-Type | `application/json` | POST, PATCH, PUT |
| Accept | `application/json` | Optional |

---

## JWT Token Format

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "id": 5,
  "role": "user",
  "iat": 1712861400,
  "exp": 1712865000
}
```

**Expiry:**
- Default: 1 hour
- Remember-me: 30 days
- Verifiable via `?remember-me=true` query param

---

## Database Schema Quick Reference

**User Fields:**
- id, user_name, first_name, last_name, email_address, password_hash, email_verified, two_factor_enabled, two_factor_secret, role, status, preferences (JSON), account_created_at, last_login_at

**Chord Fields:**
- id, notation_id, tuning_id, grip_id
- Unique constraint: (notation_id, tuning_id, grip_id)

**UserToken Fields:**
- id, user_id, token, type, created_at, expires_at
- Types: email_verification, password_reset, api_access

**User Roles:**
- `user`: Can read public data, manage own chords, access TOTP settings
- `admin`: Can manage all users, update chords, configure system

**User Status:**
- `active`: Account is active
- `pending`: Account awaiting email verification
- `suspended`: Account is locked

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Run tests
npm test
npm run test:watch      # Watch mode
npm run test:verbose    # Verbose output

# Database setup
npm run db:setup        # Generate Prisma, migrate, seed

# Database management
npm run db:backup       # Create backup
npm run migrate         # Run Prisma migrations
npm run seed:chords     # Seed chord data
npm run seed:users      # Seed user data

# Production
npm start               # Start production server
npm run deploy          # Deploy migrations in production
```

---

## Environment Variables

```bash
# Server
PORT=3030

# Database
DB_HOST=localhost
DB_USER=chordRadar
DB_PASS=admin
DB_NAME=chord_radar

# JWT
JWT_SECRET=your-secret-key-here
API_TOKEN_EXPIRATION=3600          # 1 hour in seconds
API_TOKEN_EXPIRATION_LONG=2592000  # 30 days in seconds

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password      # Not your Gmail password!
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Validation failed" error | Check error details; ensure data types match schema |
| "Invalid token" error | JWT expired or malformed; re-login to get new token |
| "Email not verified" error | User must verify email first (check registration flow) |
| "Account status was restricted" | User account suspended; admin action required |
| "Unauthorized" on protected route | Missing or invalid Authorization header |
| "TOTP code must be 6-digit" | Ensure TOTP code is exactly 6 digits |
| Database connection failed | Check DB_HOST, DB_USER, DB_PASS in .env; ensure MySQL running |

---

## API Documentation

**Swagger/OpenAPI:** http://localhost:3030/docs

**Raw Spec:** [docs/openapi.yaml](docs/openapi.yaml)

---

**For detailed technical documentation, see [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md)**
