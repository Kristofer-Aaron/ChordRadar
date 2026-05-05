# Architecture

## High-Level Diagram
```mermaid
flowchart TB
    User[Admin User]

    subgraph Views[ChordRadarAdmin.Views]
      App[App.xaml.cs]
      WinLogin[LoginWindow]
      WinMain[MainWindow]
      Pages[Pages + Dialogs]
      DialogSvc[Views.Services.DialogService]
    end

    subgraph VM[ChordRadarAdmin.ViewModels]
      LoginVM[LoginViewModel]
      MainVM[MainWindowViewModel]
      EntityVMs[Chord/Grip/Tuning/Notation/User List VMs]
      EditVMs[Edit VMs]
    end

    subgraph Core[ChordRadarAdmin.Core]
      ApiSvc[ApiService]
      AuthSvc[AuthService]
      EntitySvc[EntityServices]
      ExportSvc[ExportService]
      Models[DTOs]
      TokenStore[TokenStore]
    end

    subgraph Backend[Backend API + DB]
      HttpApi[REST API]
      Db[(SQL Server - To be confirmed)]
    end

    User --> WinLogin
    App --> LoginVM
    LoginVM --> AuthSvc
    AuthSvc --> ApiSvc
    ApiSvc --> HttpApi
    HttpApi --> Db

    WinMain --> MainVM
    MainVM --> EntityVMs
    EntityVMs --> EntitySvc
    EntityVMs --> ExportSvc
    EntityVMs --> DialogSvc
    EntitySvc --> ApiSvc

    EditVMs --> DialogSvc
    EntityVMs --> Models
    EntitySvc --> Models
```

## Composition Root and Object Lifetimes
- Composition root: `ChordRadarAdmin.Views/App.xaml.cs`
- Core service registration: `ChordRadarAdmin.Core/Infrastructure/ServiceExtensions.cs`
- Main runtime lifetimes:
  - `Singleton`: API/auth/entity/export and shared infrastructure services
  - `Transient`: ViewModels and main windows

## UI Composition
- DataTemplates in `ChordRadarAdmin.Views/App.xaml` map list ViewModels to page views.
- `MainWindowViewModel` controls active page and triggers refresh when navigating.

## Data and Control Flow
1. Login credentials captured by `LoginWindow` and `LoginViewModel`.
2. `AuthService` calls `/auth/login/gui`.
3. Token stored in `TokenStore` and attached by `ApiService` to future requests.
4. Entity list ViewModels call entity services for CRUD.
5. Dialog service bridges UI dialogs to edit DTOs.

## Error Handling
- HTTP errors are mapped in `ApiService.MapHttpError` to typed exceptions.
- Top-level unhandled dispatcher exceptions display a message box in `App.xaml.cs`.

## Architectural Constraints
- Desktop client has no direct DB access.
- Backend API contract is the system boundary.
- Role enforcement is effectively backend-driven rather than client-hidden routes.
