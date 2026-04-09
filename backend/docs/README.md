# ChordRadar Backend Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Development Environment](#development-environment)
4. [Database Configuration](#database-configuration)
5. [API Documentation](#api-documentation)
6. [Authentication System](#authentication-system)
7. [User Management](#user-management)
8. [Chord Management](#chord-management)
9. [Notation System](#notation-system)
10. [Tunings](#tunings)
11. [Grips](#grips)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)
15. [Security Best Practices](#security-best-practices)
16. [Performance Optimization](#performance-optimization)
17. [Contributing](#contributing)

---

## Overview

### Project Description

ChordRadar is a chord progression analysis and management application that provides tools for musicians to:
- Analyze chord progressions
- Manage chord libraries
- Store chord notation in multiple formats (standard, slash notation, jazz notation)
- Support multiple guitar tunings
- Organize chords with custom grips
- Track usage statistics

### Target Environment

- **Backend Runtime**: Node.js
- **Database**: SQL Server
- **API Framework**: Hapi.js with hapi-auth-jwt2
- **Frontend**: Separate React application (see parent repository)
- **Deployment**: Windows Server environment

### Stakeholders

- **End Users**: Musicians, music teachers, students
- **Developers**: Backend engineers maintaining the API
- **DevOps**: System administrators handling deployment
- **QA Team**: Quality assurance testers

### Key Features

- RESTful API for chord management
- JWT-based authentication
- Multiple chord notation formats
- Custom tuning support
- Usage tracking and analytics
- Secure data handling with JWT tokens

---

## Project Structure

```
backend/
├── controllers/
│   ├── auth/
│   │   └── authController.js
│   ├── chords/
│   │   └── chordController.js
│   ├── users/
│   │   └── userController.js
│   └── tunings/
│       └── tuningController.js
├── models/
│   ├── Chord.js
│   ├── User.js
│   ├── Tuning.js
│   └── Grip.js
├── routes/
│   ├── chords/
│   │   ├── chordRoutes.js
│   │   └── chordRoutes.spec.js
│   ├── auth/
│   │   └── authRoutes.js
│   ├── users/
│   │   └── userRoutes.js
│   └── tunings/
│       └── tuningRoutes.js
├── lib/
│   ├── auth.js
│   └── errorHandlers.js
├── src/
├── utils/
├── .env.example
├── package.json
└── index.js
```

### Key Directories

- **`controllers/`**: Business logic for each resource
- **`routes/`**: API endpoint definitions and middleware
- **`models/`**: Database model definitions
- **`lib/`**: Shared utilities and authentication logic
- **`utils/`**: Helper functions

---

## Development Environment

### Prerequisites

- **Node.js**: 18.x or higher
- **npm** or **yarn**
- **SQL Server**: 2016 or higher
- **Git**

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up database:
   ```bash
   npm run migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

---

## Database Configuration

### Database Details

- **Type**: Microsoft SQL Server
- **Connection String**: Configured in `.env` as `DB_CONNECTION_STRING`
- **Database Name**: `ChordRadarDB`
- **Collation**: `SQL_Latin1_General_CP1_CI_AS` (case-insensitive)

### Schema Overview

#### Users Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Unique user identifier |
| `email` | VARCHAR(255) | User email (unique) |
| `password` | VARCHAR(255) | Hashed password (bcrypt) |
| `name` | VARCHAR(255) | User display name |
| `createdAt` | DATETIME | Account creation timestamp |
| `updatedAt` | DATETIME | Last update timestamp |

#### Chords Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Unique chord identifier |
| `name` | VARCHAR(100) | Chord name (e.g., "Am7") |
| `notationStandard` | VARCHAR(255) | Standard notation |
| `notationSlash` | VARCHAR(255) | Slash notation |
| `notationJazz` | VARCHAR(255) | Jazz notation |
| `createdAt` | DATETIME | Creation timestamp |
| `updatedAt` | DATETIME | Last update timestamp |

#### Tunings Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Unique tuning identifier |
| `name` | VARCHAR(100) | Tuning name (e.g., "Drop D") |
| `notes` | VARCHAR(50) | Tuning string (e.g., "DADGBE") |
| `createdAt` | DATETIME | Creation timestamp |
| `updatedAt` | DATETIME | Last update timestamp |

#### Grips Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Unique grip identifier |
| `chordId` | INT (FK) | Reference to chord |
| `fingerPosition` | VARCHAR(50) | Finger placement description |
| `createdAt` | DATETIME | Creation timestamp |

---

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All endpoints require JWT authentication except:
- `POST /auth/login`
- `POST /auth/register`

### Headers

```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Register new user |
| GET | `/auth/me` | Get current user info |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

#### Chords

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chords` | List all chords |
| GET | `/chords/:id` | Get chord by ID |
| POST | `/chords` | Create new chord |
| PUT | `/chords/:id` | Update chord |
| DELETE | `/chords/:id` | Delete chord |

#### Tunings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tunings` | List all tunings |
| GET | `/tunings/:id` | Get tuning by ID |
| POST | `/tunings` | Create new tuning |
| PUT | `/tunings/:id` | Update tuning |
| DELETE | `/tunings/:id` | Delete tuning |

---

## Authentication System

### JWT Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234567890 + EXPIRATION_SECONDS
}
```

### Token Generation

Tokens are generated in `lib/auth.js` using the `@hapi/jwt` package:

```javascript
const jwt = require('@hapi/jwt');

function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
```

### Token Validation

Middleware validates tokens in `routes/**/*.js` files:

```javascript
h.auth({
  strategy: 'jwt',
  verify: async (art, request, h) => {
    const user = await UserService.findByEmail(art.payload.email);
    return { user };
  }
});
```

---

## User Management

### User Registration

1. User submits registration form with email and password
2. System validates input and checks for existing email
3. Password is hashed using bcrypt
4. User record is created in database
5. JWT token is generated and returned
6. Response includes user info and token

### User Login

1. User provides email and password
2. System validates credentials
3. JWT token is generated
4. Token is returned with user information
5. Client stores token for future requests

---

## Chord Management

### Creating a Chord

```javascript
const chord = {
  name: "Am7",
  notationStandard: "Amin7",
  notationSlash: "A/C/E",
  notationJazz: "A7sus4",
  createdAt: new Date(),
  updatedAt: new Date()
};

const result = await Chord.create(chord);
```

### Updating a Chord

```javascript
const updates = {
  name: "Am7sus4",
  notationSlash: "A/C/E/G"
};

await Chord.findByIdAndUpdate(chordId, updates, {
  where: { id: chordId }
});
```

---

## Notation System

### Supported Formats

1. **Standard Notation**: Traditional chord names (e.g., "Cmaj7", "F#m7")
2. **Slash Notation**: Chord with specific bass note (e.g., "C/E", "F/G")
3. **Jazz Notation**: Extended chord symbols (e.g., "C7alt", "C#m7(b5)")

### Conversion Utility

```javascript
function convertNotation(chord, targetFormat) {
  const conversions = {
    standard: chord.notationStandard,
    slash: chord.notationSlash,
    jazz: chord.notationJazz
  };
  
  return conversions[targetFormat] || chord.notationStandard;
}
```

---

## Tunings

### Custom Tuning Creation

```javascript
const tuning = {
  name: "Drop D",
  notes: "DADGBE" // EADGBE is standard
};

const result = await Tuning.create(tuning);
```

### Retrieving Tuning Info

```javascript
const tuning = await Tuning.findByNotes("DADGBE");
console.log({
  name: tuning.name,
  notes: tuning.notes.split('').map(n => n.toUpperCase()),
  strings: tuning.notes.split('').map((n, i) => ({
    position: i,
    note: n,
    octave: 4 // Adjust based on tuning
  }))
});
```

---

## Grips

### Grip Storage

Grips are chord-specific finger placements:

```javascript
const grip = {
  chordId: chord.id,
  fingerPosition: "Index: 1st fret, Middle: 2nd fret, Ring: 3rd fret"
};

await Grip.create(grip);
```

---

## Testing

### Unit Tests

```bash
npm test
```

### Running Specific Test Suite

```bash
npm test chords.spec.js
```

### Test Coverage

```bash
npm run test:coverage
```

### Example Test Case

```javascript
describe('Chord Controller', () => {
  it('should create a new chord', async () => {
    const chord = {
      name: 'C',
      notationStandard: 'C',
      notationSlash: 'C',
      notationJazz: 'C'
    };
    
    const response = await createChord(chord);
    expect(response.statusCode).toEqual(201);
    expect(response.result.id).toBeDefined();
  });
});
```

---

## Deployment

### Build Process

```bash
npm run build
```

### Environment Variables

Create `.env` file with:

```env
PORT=3000
DB_CONNECTION_STRING=Server=localhost;Database=ChordRadarDB;User=sa;Password=yourpassword;
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Health Check Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

### Logging

Logs are written to console and file:

```bash
npm run logs
```

---

## Troubleshooting

### Common Issues

#### Connection Refused

```
Error: ECONNREFUSED
```

**Solution**: Verify SQL Server is running and connection string is correct

#### Token Expiration

```
Unauthorized: Invalid or expired token
```

**Solution**: Refresh authentication token

#### Duplicate Email

```
Database error: Duplicate entry for email
```

**Solution**: Email must be unique in the users table

---

## Security Best Practices

### Password Hashing

- Use bcrypt with salt rounds of 10-12
- Never store plain text passwords
- Example: `bcrypt.hash('password', 10)`

### JWT Security

- Store JWT secret in environment variables
- Use strong, random secrets (32+ characters)
- Implement token expiration (default: 7 days)
- Rotate keys periodically

### Input Validation

- Sanitize all user inputs
- Use parameterized queries
- Implement rate limiting
- Validate email formats

---

## Performance Optimization

### Database Queries

- Use indexed columns for search
- Implement pagination for lists
- Cache frequently accessed data

### API Response Time

- Keep responses under 200ms for 95% of requests
- Implement connection pooling
- Use async/await for better performance

---

## Contributing

### Code Style

- Follow existing code patterns
- Use ESLint for linting
- Write meaningful commit messages

### Git Workflow

```bash
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: implement your feature"
git push origin feature/your-feature-name
```

### Pull Request Checklist

- [ ] Code follows project conventions
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No sensitive information committed

---

## Quick Reference

### Common Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint

# Create migration
npm run migrate:create <name>
npm run migrate:run

# View logs
npm run logs
```

### API Endpoints Summary

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| Auth | - | ✅ | - | - |
| Users | ✅ | - | ✅ | ✅ |
| Chords | ✅ | ✅ | ✅ | ✅ |
| Tunings | ✅ | ✅ | ✅ | ✅ |
| Grips | ✅ | ✅ | ✅ | ✅ |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| DB_CONNECTION_STRING | SQL Server connection | Required |
| JWT_SECRET | JWT signing secret | Required |
| JWT_EXPIRES_IN | Token expiration | 7d |
| NODE_ENV | Environment | development |

---

*Last updated: $(date +%Y-%m-%d)*
