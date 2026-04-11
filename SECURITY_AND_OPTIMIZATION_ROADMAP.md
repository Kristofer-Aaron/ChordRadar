# ChordRadar Security & Optimization Roadmap

**Priority Level:** High  
**Target Completion:** 12 weeks  
**Last Updated:** April 11, 2026

---

## Executive Summary

This roadmap outlines immediate security fixes, architectural improvements, and performance optimizations for the ChordRadar API. Estimated effort: 60-80 hours across 4 phases (12 weeks).

**Critical Issues Requiring Immediate Action:**
1. ⚠️ Hardcoded database credentials
2. ⚠️ No rate limiting (brute-force vulnerability)
3. ⚠️ No structured logging (no audit trail)
4. ⚠️ Weak TOTP backup codes (8 chars vs 16+ recommended)

---

## Phase 1: Security Hardening (Weeks 1-2)

### 1.1 Migrate to Secrets Manager

**Current State:** Credentials hardcoded in .env, checked into version control

**Target:** AWS Secrets Manager or HashiCorp Vault

**Implementation Steps:**

1. **Setup Secrets Manager**
   - AWS: Create secret `chordradar/production/db`
   - Content: JSON with DB_HOST, DB_USER, DB_PASS, DB_NAME
   
2. **Update Application Startup**
   ```javascript
   // src/config/secrets.js (NEW FILE)
   import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
   
   const client = new SecretsManagerClient({ region: "us-east-1" });
   
   export async function loadSecrets() {
     try {
       const result = await client.send(
         new GetSecretValueCommand({ SecretId: "chordradar/production/db" })
       );
       const secret = JSON.parse(result.SecretString);
       return {
         DB_HOST: secret.host,
         DB_USER: secret.username,
         DB_PASS: secret.password,
         DB_NAME: secret.database,
         JWT_SECRET: process.env.JWT_SECRET, // Keep in env for now
       };
     } catch (error) {
       console.error("Failed to load secrets:", error);
       throw error;
     }
   }
   
   // src/server.js (MODIFIED)
   import { loadSecrets } from "./config/secrets.js";
   
   const secrets = await loadSecrets();
   Object.assign(process.env, secrets);
   
   const app = await import("./app.js").default;
   app.listen(PORT, () => { ... });
   ```

3. **Update CI/CD**
   - GitHub Actions: Use AWS credentials to fetch secrets
   - Inject into environment before container start
   - Dockerfile: Remove .env from image

4. **Rotation Strategy**
   - Rotate DB password every 90 days
   - Automatically refresh JWT secret quarterly
   - Test secret rotation in staging before production

**Acceptance Criteria:**
- ✓ No credentials in version control
- ✓ Secrets fetched from manager at startup
- ✓ Application fails safely if secrets unavailable
- ✓ Rotation tested in staging

**Files to Create/Modify:**
- CREATE: `src/config/secrets.js`
- MODIFY: `src/server.js`, `.gitignore`, `Dockerfile`
- CREATE: `docs/SECRETS_MANAGEMENT.md`

**Effort:** 4 hours

---

### 1.2 Implement Rate Limiting

**Current State:** No rate limiting; brute-force attacks possible

**Target:** 5 failed attempts per 15 minutes per IP

**Implementation:**

```bash
npm install express-rate-limit
```

**Code:**
```javascript
// src/middlewares/rateLimiting.js (NEW FILE)
import rateLimit from "express-rate-limit";

// Limit login attempts: 5 per 15 min
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                     // 5 requests
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit registration: 3 per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many registration attempts, please try again later",
});

// Global limiter: 100 requests per 15 min
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path.startsWith('/docs'), // Don't limit docs
});

// src/routes/authRoutes.js (MODIFIED)
import { loginLimiter, registerLimiter } from "../middlewares/rateLimiting.js";

router.post('/login', loginLimiter, requireEmailVerified, ..., AuthController.login);
router.post('/register', registerLimiter, validate(...), AuthController.register);

// src/app.js (MODIFIED)
import { globalLimiter } from "./middlewares/rateLimiting.js";

app.use(globalLimiter);
```

**Testing:**
```bash
# Test rate limiter
for i in {1..6}; do
  curl -X POST http://localhost:3030/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email_address":"test@test.com","password":"test"}'
done
# 6th request should return 429
```

**Acceptance Criteria:**
- ✓ Login endpoint limited to 5 attempts/15 min
- ✓ Register endpoint limited to 3 attempts/hour
- ✓ Global limit 100 requests/15 min
- ✓ Rate limit headers included in response
- ✓ Test coverage validates limits

**Files to Create/Modify:**
- CREATE: `src/middlewares/rateLimiting.js`
- MODIFY: `src/routes/authRoutes.js`, `src/app.js`
- CREATE: `tests/rateLimiting.test.js`

**Effort:** 2 hours

---

### 1.3 Add Structured Logging

**Current State:** Minimal logging (console.error in exception handlers)

**Target:** Winston logger with request correlation IDs

**Implementation:**

```bash
npm install winston uuid
```

**Code:**
```javascript
// src/config/logger.js (NEW FILE)
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

export default logger;

// src/middlewares/requestLogging.js (NEW FILE)
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";

export function requestLogger(req, res, next) {
  const requestId = uuidv4();
  req.id = requestId;

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || "anonymous",
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}

// src/app.js (MODIFIED)
import { requestLogger } from "./middlewares/requestLogging.js";

app.use(requestLogger);

// src/controllers/authController.js (MODIFIED - example)
export const AuthController = {
  async login(req, res) {
    try {
      logger.info({
        requestId: req.id,
        action: "login_attempt",
        email: req.body.email_address,
      });
      
      const { email_address, password } = req.body;
      const user = await UserModel.findByEmail(email_address);
      if (!user) {
        logger.warn({
          requestId: req.id,
          action: "login_failed",
          reason: "user_not_found",
          email: email_address,
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        logger.warn({
          requestId: req.id,
          action: "login_failed",
          reason: "invalid_password",
          userId: user.id,
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      logger.info({
        requestId: req.id,
        action: "login_success",
        userId: user.id,
      });
      // ... rest of login logic
    } catch (err) {
      logger.error({
        requestId: req.id,
        action: "login_error",
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};
```

**Acceptance Criteria:**
- ✓ All requests logged with correlation ID
- ✓ Auth events logged (success, failure, reason)
- ✓ Error logs include stack traces
- ✓ Response times tracked
- ✓ Logs stored in files (logs/combined.log, logs/error.log)
- ✓ Log rotation configured (max 10MB per file)

**Files to Create/Modify:**
- CREATE: `src/config/logger.js`
- CREATE: `src/middlewares/requestLogging.js`
- MODIFY: `src/app.js`, all controllers
- CREATE: `.gitignore` entry for logs/

**Effort:** 6 hours

---

### 1.4 Enhance TOTP Backup Codes

**Current State:** 8-char hex tokens (32-bit entropy)

**Target:** 16-char alphanumeric (88-bit entropy), one-time use

**Implementation:**

```javascript
// src/utils/totp.js (MODIFIED)
import crypto from 'crypto';

// OLD:
export function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex') // 8 chars
  );
}

// NEW:
export function generateBackupCodes(count = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: count }, () => {
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  });
}

// src/models/userModel.js (MODIFIED)
async updateTwoFactorBackupCodes(userId, backupCodes) {
  const hashedCodes = await Promise.all(
    backupCodes.map(code => bcrypt.hash(code, 10))
  );
  
  await pool.query(
    `UPDATE users SET two_factor_backup = ? WHERE id = ?`,
    [JSON.stringify(hashedCodes), userId]
  );
}

async consumeBackupCode(userId, code) {
  const user = await this.findById(userId);
  const codes = user.two_factor_backup ? JSON.parse(user.two_factor_backup) : [];
  
  for (let i = 0; i < codes.length; i++) {
    if (await bcrypt.compare(code, codes[i])) {
      // Remove used code
      codes.splice(i, 1);
      await pool.query(
        `UPDATE users SET two_factor_backup = ? WHERE id = ?`,
        [JSON.stringify(codes), userId]
      );
      return true;
    }
  }
  return false;
}

// src/controllers/authController.js (MODIFIED)
export const AuthController = {
  async totpDisable(req, res) {
    try {
      const { password, totp_token, backup_code } = req.body || {};
      const userId = req.user.id;

      // ... validation logic ...

      // If using backup code:
      if (backup_code) {
        const isValid = await UserModel.consumeBackupCode(userId, backup_code);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid backup code" });
        }
      }

      await UserModel.disableTwoFactor(userId);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[totpDisable] error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
```

**Database Migration:**
```sql
-- migrations/20260411_enhance_backup_codes.sql
ALTER TABLE users MODIFY COLUMN two_factor_backup JSON;
-- Store as array of hashed codes instead of plaintext
```

**Acceptance Criteria:**
- ✓ Backup codes now 16 chars (alphanumeric)
- ✓ Codes hashed with bcrypt before storage
- ✓ Codes consumed after use (cannot be reused)
- ✓ Database migration applies cleanly
- ✓ Tests validate one-time use behavior

**Files to Create/Modify:**
- MODIFY: `src/utils/totp.js`, `src/models/userModel.js`, `src/controllers/authController.js`
- CREATE: `prisma/migrations/20260411_enhance_backup_codes.sql`

**Effort:** 4 hours

**Phase 1 Total: 16 hours**

---

## Phase 2: Architecture Refactoring (Weeks 3-6)

### 2.1 Standardize on Raw SQL (Drop Unused Prisma)

**Current State:** Prisma schema exists but not used; raw mysql2 pool dominates

**Decision:** Keep raw SQL (lighter weight, already embedded)

**Why:** 
- Prisma adds 5MB to bundle
- All ORM functionality reimplemented at model layer
- Single database (MySQL), no need for dialect abstraction
- Raw SQL provides explicit control

**Implementation:**

1. Remove Prisma from package.json:
   ```bash
   npm uninstall @prisma/client prisma
   npm uninstall --save-dev prisma
   ```

2. Convert Prisma migrations to raw SQL:
   ```bash
   # Copy each migration.sql to migrations/raw/
   # Remove prisma/ migrations folder
   ```

3. Create migration runner:
   ```javascript
   // scripts/runMigrations.js
   import fs from 'fs/promises';
   import path from 'path';
   import pool from '../src/config/db.js';

   async function runMigrations() {
     const migrationsDir = './prisma/migrations/raw';
     const files = await fs.readdir(migrationsDir);
     
     for (const file of files.sort()) {
       const filepath = path.join(migrationsDir, file);
       const sql = await fs.readFile(filepath, 'utf-8');
       console.log(`Running ${file}...`);
       const conn = await pool.getConnection();
       try {
         await conn.query(sql);
         console.log(`✓ ${file}`);
       } finally {
         conn.release();
       }
     }
   }

   runMigrations().catch(console.error);
   ```

4. Update scripts in package.json:
   ```json
   {
     "scripts": {
       "db:migrate": "node scripts/runMigrations.js",
       "db:setup": "npm run db:migrate && npm run seed:chords"
     }
   }
   ```

**Effort:** 3 hours

---

### 2.2 Implement Centralized Error Handling

**Current State:** Each controller handles errors independently, inconsistent responses

**Target:** Custom error classes, error middleware

**Implementation:**

```javascript
// src/utils/errors.js (NEW FILE)
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

// src/middlewares/errorHandler.js (NEW FILE)
import logger from '../config/logger.js';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown';
  
  logger.error({
    requestId,
    error: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  let statusCode = 500;
  let response = { error: 'Internal Server Error' };

  if (err instanceof ValidationError) {
    statusCode = 400;
    response = { error: err.message, details: err.details };
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    response = { error: err.message };
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    response = { error: err.message };
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    response = { error: err.message };
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    response = { error: err.message };
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    response = { error: 'Resource already exists' };
  }

  res.status(statusCode).json(response);
}

// src/app.js (MODIFIED - add at end after all routes)
import { errorHandler } from './middlewares/errorHandler.js';

app.use(errorHandler);

// src/controllers/chordController.js (MODIFIED - example)
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';

export const ChordController = {
  async getById(req, res) {
    const { id } = req.params;
    if (isNaN(id)) throw new ValidationError('Invalid ID format');
    
    const row = await ChordModel.findById({ id: Number(id) });
    if (!row) throw new NotFoundError('Chord not found');
    
    res.json(row);
  },

  async create(req, res) {
    try {
      const result = await ChordModel.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Chord already exists');
      }
      throw err;
    }
  },
};
```

**Acceptance Criteria:**
- ✓ All controllers throw custom errors
- ✓ Error middleware transforms to HTTP responses
- ✓ Consistent error response format
- ✓ Errors logged with context
- ✓ Status codes correct for all error types

**Files to Create/Modify:**
- CREATE: `src/utils/errors.js`
- CREATE: `src/middlewares/errorHandler.js`
- MODIFY: `src/app.js`, all controllers

**Effort:** 5 hours

---

### 2.3 Implement Response Standardization

**Current State:** Response shapes vary by endpoint

**Target:** Consistent { ok, data, error } wrapper

**Implementation:**

```javascript
// src/middlewares/responseFormatter.js (NEW FILE)
export function successResponse(data, statusCode = 200) {
  return (req, res) => {
    res.status(statusCode).json({
      ok: true,
      data,
    });
  };
}

// src/controllers/chordController.js (MODIFIED)
async getAll(req, res) {
  const rows = await ChordModel.findAll();
  res.json({ ok: true, data: rows });
}

async getById(req, res) {
  const row = await ChordModel.findById(Number(req.params.id));
  if (!row) throw new NotFoundError('Chord not found');
  res.json({ ok: true, data: row });
}

async create(req, res) {
  const result = await ChordModel.create(req.body);
  res.status(201).json({ ok: true, data: result });
}
```

**Effort:** 2 hours

**Phase 2 Total: 10 hours**

---

## Phase 3: Testing & Documentation (Weeks 7-10)

### 3.1 Expand Test Coverage

**Current State:** 30-40% coverage, incomplete mocks

**Target:** 70%+ coverage with integration tests

See test implementation guide in Phase 3 documentation.

**Effort:** 20 hours

### 3.2 Complete OpenAPI Documentation

**Current State:** docs/openapi.yaml incomplete

**Target:** Full spec with examples, error codes

**Effort:** 8 hours

**Phase 3 Total: 28 hours**

---

## Phase 4: Performance Optimization (Weeks 11-12)

### 4.1 Add Database Indexes

```sql
-- migrations/20260411_add_indexes.sql
CREATE INDEX idx_user_tokens_user_id_type ON user_tokens(user_id, type, expires_at);
CREATE INDEX idx_chords_notation_tuning_grip ON chords(notation_id, tuning_id, grip_id);
CREATE INDEX idx_user_chord_relations_user_id ON user_chord_relations(user_id);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);
```

**Effort:** 1 hour

### 4.2 Implement Caching

Use Redis for reference data (notations, tunings, grips)

**Effort:** 6 hours

### 4.3 Add Pagination

Implement cursor-based pagination for chord lists

**Effort:** 4 hours

**Phase 4 Total: 11 hours**

---

## Summary Timeline

| Phase | Weeks | Hours | Outcomes |
|-------|-------|-------|----------|
| 1: Security | 1-2 | 16 | Secrets mgmt, rate limiting, logging, strong backup codes |
| 2: Architecture | 3-6 | 10 | Drop Prisma, centralized error handling, response standardization |
| 3: Testing | 7-10 | 28 | 70%+ coverage, complete API docs |
| 4: Performance | 11-12 | 11 | Indexes, caching, pagination |
| **TOTAL** | **12 weeks** | **65 hours** | **Production-ready API** |

---

## Success Criteria (Definition of Done)

### Security ✓
- [ ] No hardcoded credentials in version control
- [ ] Rate limiting active on auth endpoints
- [ ] All authentication events logged
- [ ] TOTP backup codes 16 chars, one-time use
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers set (X-Frame-Options, CSP, etc.)

### Architecture ✓
- [ ] Consistent error handling via custom error classes
- [ ] Standardized response format across all endpoints
- [ ] No Prisma dependencies
- [ ] Dependency injection for controllers/models
- [ ] Clear separation of concerns (routes → controllers → models → db)

### Testing ✓
- [ ] 70%+ code coverage
- [ ] All controllers unit tested
- [ ] Middleware tested (auth, validation, error handling)
- [ ] Database integration tests for all models
- [ ] E2E tests for critical flows (registration, login, TOTP)

### Documentation ✓
- [ ] OpenAPI spec complete with examples
- [ ] Request/response schemas documented
- [ ] Error codes and retry logic explained
- [ ] Deployment guide with secrets manager setup
- [ ] Security best practices guide

### Performance ✓
- [ ] Database indexes applied
- [ ] Reference data cached in Redis
- [ ] Pagination implemented for large datasets
- [ ] Query response times < 100ms (95th percentile)
- [ ] API throughput > 1000 req/sec under load

---

**Document Version:** 1.0  
**Last Updated:** April 11, 2026  
**Owner:** ChordRadar Development Team
