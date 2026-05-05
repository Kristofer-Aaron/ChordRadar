# Testing and Test Cases

## Current Testing Strategy
Current automated coverage in this repository is minimal.

Observed status:
- Test project exists: `ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj`
- Framework stack: xUnit, Moq, Coverlet collector
- Existing user test file: `ChordRadarAdmin.Tests/UnitTest1.cs` (placeholder)

Recommended practical strategy for this codebase:
1. Unit tests for ViewModels (command enablement, validation, state changes).
2. Unit tests for core services (payload composition, error mapping).
3. Integration smoke tests for API contract compatibility (optional, environment dependent).
4. UI automation tests (optional future step for WPF dialogs/pages).

## Test Frameworks and Configuration
- `xunit`
- `Moq`
- `Microsoft.NET.Test.Sdk`
- `coverlet.collector`

Configured in:
- `ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj`

## How to Run Tests
- Run all tests:
  - `dotnet test ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj`
- Run with basic coverage collector:
  - `dotnet test ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj --collect:"XPlat Code Coverage"`

## Test Data / Seeding Approach
- No dedicated seeding fixtures are present in this repo.
- For API-dependent checks, use backend test environment with known records.

## Test Case Catalogue
The following catalog is implementation-oriented and maps to existing modules/endpoints.

### Authentication
- **TC-AUTH-001**
  - Purpose: Login succeeds with valid credentials.
  - Preconditions: Backend is reachable; valid admin user exists.
  - Steps: Open login window, input valid email/password, click Login.
  - Expected: Main window opens; no error message.
  - Module: `LoginViewModel`, `AuthService`.

- **TC-AUTH-002**
  - Purpose: Login fails on empty credentials.
  - Preconditions: App opened to login window.
  - Steps: Leave fields empty, click Login.
  - Expected: Validation error shown; no API request.
  - Module: `LoginViewModel`.

- **TC-AUTH-003**
  - Purpose: Logout returns to login window.
  - Preconditions: Logged in.
  - Steps: Click Logout in main window.
  - Expected: Main closes, login window shows.
  - Module: `MainWindowViewModel`, `App.xaml.cs`.

### Navigation and Shell
- **TC-SHELL-001**
  - Purpose: Default page after login is Chords tab.
  - Preconditions: Successful login.
  - Steps: Observe content area immediately after main opens.
  - Expected: Chords list page is shown and refresh is attempted.
  - Module: `MainWindowViewModel`.

- **TC-SHELL-002**
  - Purpose: Theme toggle switches resource dictionary.
  - Preconditions: Logged in.
  - Steps: Click Toggle Theme.
  - Expected: Theme changes between Light/Dark resources.
  - Module: `MainWindowViewModel`, `App.SwitchTheme`.

### Chords / Grips / Tunings / Notations
- **TC-CHORD-001**
  - Purpose: Edit/Delete enable only when row selected.
  - Preconditions: Chord rows loaded.
  - Steps: Observe buttons before/after selecting a row.
  - Expected: Buttons disabled with no selection, enabled with selection.
  - Module: `ChordListViewModel`.

- **TC-CHORD-002**
  - Purpose: Chord export enabled when list has rows.
  - Preconditions: Chords loaded.
  - Steps: Open tab right after login and observe Export state.
  - Expected: Export enabled when `Items.Count > 0`.
  - Module: `ChordListViewModel`.

- **TC-GRIP-001**
  - Purpose: Grip list excludes created/updated display columns.
  - Preconditions: Open Grips tab.
  - Steps: Inspect grid columns.
  - Expected: ID and Strings are displayed; no Created/Updated.
  - Module: `GripsPage.xaml`.

- **TC-TUNING-001**
  - Purpose: Tuning editor dialog input visible and save/cancel functional.
  - Preconditions: Tunings tab loaded.
  - Steps: Click Add and inspect dialog, input value, save.
  - Expected: Dialog layout fits controls; save issues POST.
  - Module: `TuningEditDialogWindow`, `TuningListViewModel`.

- **TC-NOTATION-001**
  - Purpose: Notation selection enables edit/delete immediately.
  - Preconditions: Notations loaded.
  - Steps: Select a row.
  - Expected: Edit/Delete enable without tab switching.
  - Module: `NotationListViewModel`.

### Users
- **TC-USER-001**
  - Purpose: Users list maps username/email correctly.
  - Preconditions: `/users` returns non-empty `user_name`, `email_address`.
  - Steps: Open Users tab.
  - Expected: Username/Email columns populated.
  - Module: `UserDto` JSON mappings.

- **TC-USER-002**
  - Purpose: Add user requires password and includes write payload fields.
  - Preconditions: Users tab open.
  - Steps: Click Add, leave password blank, save; then add valid password and save.
  - Expected: First attempt blocked by validation; second sends POST and succeeds.
  - Module: `UserEditViewModel`, `EntityServices.UserService.CreateAsync`.

- **TC-USER-003**
  - Purpose: Edit user sends PATCH without password field.
  - Preconditions: Existing user selected.
  - Steps: Click Edit, change last name/status, save.
  - Expected: PATCH request succeeds with expected editable fields.
  - Module: `EntityServices.UserService.UpdateAsync`.

- **TC-USER-004**
  - Purpose: User details panel shows requested profile fields.
  - Preconditions: User selected with detail fields in API response.
  - Steps: Inspect detail panel.
  - Expected: first_name, last_name, password_changed_at, two_factor_enabled, conditional two_factor_method, account_created_at, last_login_at, preferences shown.
  - Module: `UsersPage.xaml`, `UserDto`.

## Coverage Gaps
- No meaningful automated unit tests currently committed (placeholder test file only).
- No integration tests for API contract changes.
- No UI automation tests for WPF dialogs/flows.
