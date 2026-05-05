# ChordRadarAdmin Developer Documentation

This folder contains developer-focused documentation for the ChordRadarAdmin WPF application.

## Documents
- [Application Overview](OVERVIEW.md)
- [Development Environment](DEVELOPMENT_ENVIRONMENT.md)
- [Data Structure (API + SQL Server Notes)](DATA_STRUCTURE.md)
- [Use Cases and Roles](USE_CASES_AND_ROLES.md)
- [Modules, Classes, and Menus](MODULES_CLASSES_MENUS.md)
- [Testing and Test Cases](TESTING.md)
- [Future Improvements](FUTURE_IMPROVEMENTS.md)
- [Architecture (deeper technical view)](ARCHITECTURE.md)
- [Request Lifecycle](REQUEST_LIFECYCLE.md)

## Quick Start
1. Build the solution:
   - `dotnet build ChordRadarAdmin.sln`
2. Run the app:
   - `dotnet run --project ChordRadarAdmin.Views/ChordRadarAdmin.Views.csproj`
3. Run tests:
   - `dotnet test ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj`

## Scope
This documentation describes the current repository contents:
- WPF desktop client projects (`ChordRadarAdmin.Views`, `ChordRadarAdmin.ViewModels`, `ChordRadarAdmin.Core`)
- Test project (`ChordRadarAdmin.Tests`)

It does not include backend server implementation details, because backend code is not present in this repository.