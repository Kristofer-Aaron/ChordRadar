# Application Overview

## What This Application Is
ChordRadarAdmin is a C# WPF desktop administration client for the ChordRadar platform. It uses an MVVM-style architecture and communicates with a backend HTTP API for authentication and CRUD operations over core entities (chords, grips, tunings, notations, users).

## Where It Is Used
- Local developer workstations (Windows, WPF runtime)
- Internal admin environments where staff manage musical metadata and user accounts

## Who Uses It
- Administrators managing users and content
- Internal operators/maintainers validating data quality and exports
- Developers extending desktop admin features

## Primary Purpose and Key Features
- Login/logout using backend authentication endpoints
- Admin navigation across tabs: Chords, Grips, Tunings, Notations, Users
- CRUD operations for core entities
- Filtering/search in list pages
- Export to CSV/JSON for entity lists
- Theme switching (light/dark)

## High-Level Architecture Summary
The app is split into four projects in `ChordRadarAdmin.sln`:
- `ChordRadarAdmin.Views`: WPF windows/pages/dialogs and app startup
- `ChordRadarAdmin.ViewModels`: page/dialog logic and command handling
- `ChordRadarAdmin.Core`: API communication, DTOs, services, infrastructure helpers
- `ChordRadarAdmin.Tests`: xUnit-based test project

At startup, `ChordRadarAdmin.Views/App.xaml.cs` constructs a DI container, opens the login window, and after successful login opens the main shell. The shell binds a current ViewModel to page DataTemplates in `ChordRadarAdmin.Views/App.xaml`, allowing navigation between tab-specific list ViewModels.

## Key Code Entry Points
- Startup and DI bootstrap: `ChordRadarAdmin.Views/App.xaml.cs`
- App resources and DataTemplates: `ChordRadarAdmin.Views/App.xaml`
- Main shell: `ChordRadarAdmin.Views/Windows/MainWindow.xaml`
- Main navigation logic: `ChordRadarAdmin.ViewModels/Main/MainWindowViewModel.cs`
- API base service: `ChordRadarAdmin.Core/Services/ApiService.cs`
- Auth flow: `ChordRadarAdmin.Core/Services/AuthService.cs`

## Related Documentation
- [Development Environment](DEVELOPMENT_ENVIRONMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Modules, Classes, and Menus](MODULES_CLASSES_MENUS.md)
- [Request Lifecycle](REQUEST_LIFECYCLE.md)
- [Testing](TESTING.md)