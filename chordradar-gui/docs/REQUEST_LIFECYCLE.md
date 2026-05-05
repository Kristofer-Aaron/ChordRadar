# Request Lifecycle

## Critical Flow 1: Login
```mermaid
sequenceDiagram
    participant U as User
    participant LW as LoginWindow
    participant LVM as LoginViewModel
    participant AS as AuthService
    participant API as ApiService
    participant BE as Backend API

    U->>LW: Enter email/password and click Login
    LW->>LVM: Execute LoginCommand
    LVM->>AS: LoginAsync(email, password)
    AS->>API: POST /auth/login/gui
    API->>BE: HTTP request (JSON)
    BE-->>API: { ok, token }
    API-->>AS: AuthLoginResponse
    AS->>AS: Parse JWT claims, store token
    AS-->>LVM: true
    LVM-->>LW: Raise LoginSucceeded
```

Code pointers:
- `ChordRadarAdmin.ViewModels/Auth/LoginViewModel.cs`
- `ChordRadarAdmin.Core/Services/AuthService.cs`
- `ChordRadarAdmin.Core/Services/ApiService.cs`

## Critical Flow 2: Entity List Load (Example: Chords)
```mermaid
sequenceDiagram
    participant MW as MainWindowViewModel
    participant CVM as ChordListViewModel
    participant CS as ChordService
    participant API as ApiService
    participant BE as Backend API

    MW->>CVM: NavigateToChords() + RefreshAsync()
    CVM->>CS: GetAllAsync()
    CS->>API: GET /api/chords?fields=...
    API->>BE: HTTP GET with Bearer token
    BE-->>API: JSON chord list
    API-->>CS: List<ChordDto>
    CS-->>CVM: List<ChordDto>
    CVM->>CVM: Populate Items, update command states
```

Code pointers:
- `ChordRadarAdmin.ViewModels/Main/MainWindowViewModel.cs`
- `ChordRadarAdmin.ViewModels/Chords/ChordListViewModel.cs`
- `ChordRadarAdmin.Core/Services/EntityServices.cs`

## Critical Flow 3: User Add/Edit
```mermaid
sequenceDiagram
    participant UVM as UserListViewModel
    participant DS as DialogService
    participant UEV as UserEditViewModel
    participant US as UserService
    participant API as ApiService
    participant BE as Backend API

    UVM->>DS: ShowUserEditorAsync(user?)
    DS->>UEV: Bind editable fields
    UEV-->>DS: Saved + UserDto payload

    alt Add
        UVM->>US: CreateAsync(user)
        US->>API: POST /users (explicit body)
    else Edit
        UVM->>US: UpdateAsync(id, user)
        US->>API: PATCH /users/{id} (explicit body)
    end

    API->>BE: HTTP request
    BE-->>API: Updated user JSON
    API-->>US: UserDto
    US-->>UVM: success
    UVM->>UVM: RefreshAsync()
```

Code pointers:
- `ChordRadarAdmin.ViewModels/Users/UserViewModels.cs`
- `ChordRadarAdmin.Views/Dialogs/UserEditDialogWindow.xaml`
- `ChordRadarAdmin.Core/Services/EntityServices.cs`

## Error Path Notes
- HTTP failures propagate as `ApiException`/mapped exceptions from `ApiService`.
- ViewModels catch and surface messages via `ErrorMessage` for bound UI display.

## State Management Notes
- Token state: in-memory via `ITokenStore`.
- Page state: `INavigationService` + `MainWindowViewModel.CurrentPage`.
- Command state: explicit `RaiseCanExecuteChanged` patterns in list ViewModels.
