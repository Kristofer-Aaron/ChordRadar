# Future Improvements

This section prioritizes enhancements by impact and implementation effort.

## 1. Externalize API Configuration
- Priority: High
- Why it matters: Base URL is hard-coded (`ApiService`), making environment switching error-prone.
- Effort: S
- Suggested approach:
  - Read base URL from app settings (JSON/env) and inject at startup.
- Affected areas:
  - `ChordRadarAdmin.Core/Services/ApiService.cs`
  - `ChordRadarAdmin.Views/App.xaml.cs`

## 2. Harden Token Storage
- Priority: High
- Why it matters: Current token store is in-memory only; no secure persistence or protection strategy.
- Effort: M
- Suggested approach:
  - Introduce secure token storage abstraction for desktop (DPAPI or Windows Credential Manager).
- Affected areas:
  - `ChordRadarAdmin.Core/Services/ITokenStore.cs`
  - `ChordRadarAdmin.Core/Services/AuthService.cs`

## 3. Add Structured Logging and Telemetry
- Priority: High
- Why it matters: Troubleshooting API and UI issues is difficult without consistent logs.
- Effort: M
- Suggested approach:
  - Add centralized logging for request failures and key user operations.
- Affected areas:
  - `ChordRadarAdmin.Core/Services/ApiService.cs`
  - `ChordRadarAdmin.Views/App.xaml.cs`

## 4. Formalize API Contract DTOs
- Priority: High
- Why it matters: Contract drift causes runtime failures and empty fields.
- Effort: M
- Suggested approach:
  - Define dedicated request/response DTOs per endpoint instead of reusing broad models.
- Affected areas:
  - `ChordRadarAdmin.Core/Models/EntityDtos.cs`
  - `ChordRadarAdmin.Core/Services/EntityServices.cs`

## 5. Improve User Management Workflows
- Priority: Medium
- Why it matters: Add/Edit currently depends on backend payload expectations and may regress with API changes.
- Effort: M
- Suggested approach:
  - Add field-level validation (email format, role/status constraints), API error surface improvements.
- Affected areas:
  - `ChordRadarAdmin.ViewModels/Users/UserViewModels.cs`
  - `ChordRadarAdmin.Views/Dialogs/UserEditDialogWindow.xaml`

## 6. Expand Automated Tests
- Priority: High
- Why it matters: Current test coverage is effectively absent.
- Effort: M/L
- Suggested approach:
  - Unit tests for command state, validation, and payload composition.
  - Integration tests against mocked API endpoints.
- Affected areas:
  - `ChordRadarAdmin.Tests/*`

## 7. Nullability Cleanup
- Priority: Medium
- Why it matters: High warning volume masks real issues and increases defect risk.
- Effort: M
- Suggested approach:
  - Address CS8618/CS8604/CS8619 warnings incrementally by module.
- Affected areas:
  - Primarily `ChordRadarAdmin.ViewModels/*`, `ChordRadarAdmin.Core/*`, `ChordRadarAdmin.Views/*`

## 8. UX Consistency and Accessibility
- Priority: Medium
- Why it matters: Dialog layouts and control states have required several fixes already.
- Effort: M
- Suggested approach:
  - Add consistent spacing/validation pattern, keyboard navigation checks, and visual state tests.
- Affected areas:
  - `ChordRadarAdmin.Views/Pages/*`
  - `ChordRadarAdmin.Views/Dialogs/*`
  - `ChordRadarAdmin.Views/Themes/*`

## 9. Reliability Patterns for API Calls
- Priority: Medium
- Why it matters: Network/transient failures currently bubble directly to UI with limited retry policy.
- Effort: M
- Suggested approach:
  - Add retry policy for transient status codes/timeouts, with safe idempotency rules.
- Affected areas:
  - `ChordRadarAdmin.Core/Services/ApiService.cs`

## 10. Documentation Maintenance Process
- Priority: Medium
- Why it matters: Rapid UI/API iteration can make docs stale.
- Effort: S
- Suggested approach:
  - Add doc update checklist for each PR affecting endpoints, DTOs, dialogs, or commands.
- Affected areas:
  - `docs/*`
