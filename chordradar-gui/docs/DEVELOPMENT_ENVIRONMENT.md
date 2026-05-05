# Development Environment

## Required Tools
- .NET SDK: `9.0` (solution targets `net9.0` and `net9.0-windows`)
- OS: Windows (WPF app)
- IDE: Visual Studio 2022 or VS Code with C# tooling

## Project and Dependency References
- Solution file: `ChordRadarAdmin.sln`
- Core packages in `ChordRadarAdmin.Core/ChordRadarAdmin.Core.csproj`:
  - `Newtonsoft.Json`
  - `System.IdentityModel.Tokens.Jwt`
  - `CsvHelper`
  - `Microsoft.Extensions.DependencyInjection`
  - `Microsoft.Extensions.Logging`
- Test packages in `ChordRadarAdmin.Tests/ChordRadarAdmin.Tests.csproj`:
  - `xunit`
  - `xunit.runner.visualstudio`
  - `Moq`
  - `coverlet.collector`

## Install Dependencies
The repo uses NuGet restore during build/test.

Commands:
- `dotnet restore ChordRadarAdmin.sln`
- `dotnet build ChordRadarAdmin.sln`

## Run Locally
- Build: `dotnet build ChordRadarAdmin.sln`
- Run desktop app:
  - `dotnet run --project ChordRadarAdmin.Views/ChordRadarAdmin.Views.csproj`

## Development Mode
There is no dedicated hot-reload script in this repo. Standard development flow is:
1. Run from Visual Studio (Debug) for XAML tooling and debugging.
2. Or use `dotnet run` from CLI for quick startup.

## Linting / Formatting
No explicit lint/format configuration files are present in repo root.

Recommended baseline commands:
- `dotnet format` (if installed in environment)
- `dotnet build ChordRadarAdmin.sln -v minimal` (compile-time validation)

## Project Structure Overview
- `ChordRadarAdmin.Core/`
  - `Services/`: HTTP/API services (`ApiService`, `AuthService`, entity services)
  - `Models/`: DTO contracts
  - `Infrastructure/`: command helpers and DI extension
- `ChordRadarAdmin.ViewModels/`
  - `Auth/`, `Main/`, `Chords/`, `Grips/`, `Tunings/`, `Notations/`, `Users/`
- `ChordRadarAdmin.Views/`
  - `Windows/`: login/main shell windows
  - `Pages/`: tab pages
  - `Dialogs/`: entity editor/export dialogs
  - `Themes/`: shared/dark/light styles
- `ChordRadarAdmin.Tests/`
  - current unit test files

## Configuration Notes
- API base URL defaults to `http://localhost:3030` in `ChordRadarAdmin.Core/Services/ApiService.cs`.
- Authentication endpoint is `/auth/login/gui` in `ChordRadarAdmin.Core/Services/AuthService.cs`.
- Token is held in in-memory `TokenStore` (`ChordRadarAdmin.Core/Services/ITokenStore.cs`).

## Troubleshooting
- App starts but cannot authenticate:
  - Verify backend API availability at configured base URL.
  - Check login endpoint compatibility: `/auth/login/gui`.
- CRUD endpoints fail for users:
  - Confirm backend supports payload keys used in `ChordRadarAdmin.Core/Services/EntityServices.cs` (`user_name`, `email_address`, etc.).
- Buttons disabled unexpectedly:
  - Selection-dependent commands rely on `RaiseCanExecuteChanged` handlers in list ViewModels.
- Many nullable warnings on build:
  - Known codebase state; warnings do not currently block build.
