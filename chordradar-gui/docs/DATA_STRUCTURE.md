# Data Structure (SQL Server + Repository Data Model)

## SQL Server Usage Confirmation
This repository is a desktop admin client and does **not** directly connect to SQL Server.

Evidence:
- Data access is HTTP-based through `ChordRadarAdmin.Core/Services/ApiService.cs`.
- Entity reads/writes are performed by API service wrappers in `ChordRadarAdmin.Core/Services/EntityServices.cs`.
- No EF Core DbContext, migrations, ADO.NET SQL commands, or direct connection strings are present in this repo.

Conclusion:
- SQL Server (if used) is part of the backend system behind the API, not this client app.

## Database Name
- **To be confirmed** (not present in this repository).

How to confirm safely:
- Check backend deployment docs.
- Or run SQL metadata query in backend environment:
  - `SELECT DB_NAME() AS database_name;`

## Storage Engine / Table Storage Notes
- This client has no direct DB engine configuration.
- **To be confirmed** in backend repository/operations docs.

## Collation / Encoding
- **To be confirmed** (not available in this client repo).

How to confirm safely:
- SQL Server query (backend environment):
  - `SELECT DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS collation;`

## Logical Tables and Fields (Inferred From DTO/API Contracts)
The following are inferred client-side models from `ChordRadarAdmin.Core/Models/EntityDtos.cs` and endpoint usage in `ChordRadarAdmin.Core/Services/EntityServices.cs`.

### Chords
- Endpoint family: `/api/chords`
- Fields observed in DTO:
  - `id`
  - `notation`
  - `tuning`
  - `grip`
- Notes:
  - Client asks backend to resolve display values via `fields` query in `ChordService`.
  - Created/updated columns were removed from list UI in current code.

### Grips
- Endpoint family: `/api/grips`
- Fields observed:
  - `id`
  - `strings`

### Tunings
- Endpoint family: `/api/tunings`
- Fields observed:
  - `id`
  - `value`

### Notations
- Endpoint family: `/api/notations`
- Fields observed:
  - `id`
  - `value`

### Users
- Endpoint family: `/users`
- Fields observed:
  - `id`
  - `user_name`
  - `first_name`
  - `last_name`
  - `email_address`
  - `password` (create payload)
  - `email_verified`
  - `role`
  - `status`
  - optional detail fields shown in UI if provided:
    - `password_changed_at`
    - `two_factor_enabled`
    - `two_factor_method`
    - `account_created_at`
    - `last_login_at`
    - `preferences`

## Relationships (Inferred)
The backend likely models lookup relationships for chords:
- chord -> notation
- chord -> tuning
- chord -> grip

Type:
- likely many-to-one from chord to each lookup table.

Exact FK names and index definitions:
- **To be confirmed** (backend schema not available here).

## Data Access Layer Mapping (Client-Side)
- `IChordService`/`ChordService` -> `/api/chords`
- `IGripService`/`GripService` -> `/api/grips`
- `ITuningService`/`TuningService` -> `/api/tunings`
- `INotationService`/`NotationService` -> `/api/notations`
- `IUserService`/`UserService` -> `/users`
- All of the above call into `IApiService`/`ApiService`.

## ORM and Migration Workflow
In this repository:
- No ORM schema files found (no Prisma/TypeORM/EF migrations).
- No migration workflow scripts found.

Backend-side ORM/migrations:
- **To be confirmed** in backend repository.

## Safe Steps to Retrieve Missing DB Metadata
Run in backend SQL Server environment (no credentials embedded in docs):
1. Database and collation:
   - `SELECT DB_NAME() AS database_name, DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS collation;`
2. Tables:
   - `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';`
3. Columns:
   - `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION;`
4. Primary keys:
   - query `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` + `KEY_COLUMN_USAGE`
5. Foreign keys:
   - query `sys.foreign_keys` and `sys.foreign_key_columns`
6. Indexes:
   - query `sys.indexes` and `sys.index_columns`
