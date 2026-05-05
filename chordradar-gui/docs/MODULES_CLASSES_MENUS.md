# Modules, Classes, and Menus

## Solution Modules
- `ChordRadarAdmin.Core`: infrastructure, models, services
- `ChordRadarAdmin.ViewModels`: presentation logic and commands
- `ChordRadarAdmin.Views`: XAML UI and dialog implementations
- `ChordRadarAdmin.Tests`: automated test project

## Core Layer
### Infrastructure
- `ChordRadarAdmin.Core/Infrastructure/ServiceExtensions.cs`
  - Registers core DI services.
- `ChordRadarAdmin.Core/Infrastructure/AsyncCommand.cs`
  - Async `ICommand` implementation used across ViewModels.
- `ChordRadarAdmin.Core/Infrastructure/RelayCommand.cs`
  - Sync command implementation.

### Services
- `ChordRadarAdmin.Core/Services/ApiService.cs`
  - HTTP transport wrapper, bearer token handling, response/error mapping.
- `ChordRadarAdmin.Core/Services/AuthService.cs`
  - Login/logout and JWT claim parsing.
- `ChordRadarAdmin.Core/Services/EntityServices.cs`
  - Entity-specific API methods (chords/grips/tunings/notations/users).
- `ChordRadarAdmin.Core/Services/ExportService.cs`
  - CSV/JSON export.

### Models
- `ChordRadarAdmin.Core/Models/AuthModels.cs`
- `ChordRadarAdmin.Core/Models/EntityDtos.cs`

## ViewModels Layer
### Shell and Navigation
- `ChordRadarAdmin.ViewModels/Main/MainWindowViewModel.cs`
  - Main page navigation, theme toggle, logout.
- `ChordRadarAdmin.Core/Services/NavigationService.cs`
  - Current page state and events.

### Auth
- `ChordRadarAdmin.ViewModels/Auth/LoginViewModel.cs`

### Entity List/Edit ViewModels
- Chords: `ChordRadarAdmin.ViewModels/Chords/ChordListViewModel.cs`, `ChordEditViewModel.cs`
- Grips: `ChordRadarAdmin.ViewModels/Grips/GripViewModels.cs`
- Tunings: `ChordRadarAdmin.ViewModels/Tunings/TuningViewModels.cs`
- Notations: `ChordRadarAdmin.ViewModels/Notations/NotationViewModels.cs`
- Users: `ChordRadarAdmin.ViewModels/Users/UserViewModels.cs`

## Views Layer
### Startup and Windows
- `ChordRadarAdmin.Views/App.xaml` + `App.xaml.cs`
- `ChordRadarAdmin.Views/Windows/LoginWindow.xaml`
- `ChordRadarAdmin.Views/Windows/MainWindow.xaml`

### Pages (Menu Targets)
- `ChordRadarAdmin.Views/Pages/ChordsPage.xaml`
- `ChordRadarAdmin.Views/Pages/GripsPage.xaml`
- `ChordRadarAdmin.Views/Pages/TuningsPage.xaml`
- `ChordRadarAdmin.Views/Pages/NotationsPage.xaml`
- `ChordRadarAdmin.Views/Pages/UsersPage.xaml`

### Dialogs
- `ChordRadarAdmin.Views/Dialogs/ChordEditDialogWindow.xaml`
- `ChordRadarAdmin.Views/Dialogs/GripEditDialogWindow.xaml`
- `ChordRadarAdmin.Views/Dialogs/TuningEditDialogWindow.xaml`
- `ChordRadarAdmin.Views/Dialogs/NotationEditDialogWindow.xaml`
- `ChordRadarAdmin.Views/Dialogs/UserEditDialogWindow.xaml`
- `ChordRadarAdmin.Views/Dialogs/ExportDialogWindow.xaml`

### Dialog Service Integration
- Interface: `ChordRadarAdmin.Core/Services/IDialogService.cs`
- Implementation: `ChordRadarAdmin.Views/Services/DialogService.cs`

## Menu Items
Main menu entries are defined in `ChordRadarAdmin.Views/Windows/MainWindow.xaml`:
- Chords
- Grips
- Tunings
- Notations
- Users
- Toggle Theme
- Logout

Behavior link:
- Commands handled by `ChordRadarAdmin.ViewModels/Main/MainWindowViewModel.cs`.

## Background Jobs / Queues
- None in current repository.

## External Integrations
- Backend HTTP API (`ApiService`)
- JWT parsing (`System.IdentityModel.Tokens.Jwt`)
- CSV export (`CsvHelper`)
