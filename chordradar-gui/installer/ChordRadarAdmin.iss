#define AppName "ChordRadar Admin"
#define AppVersion "1.0.0"
#define AppPublisher "ChordRadar"
#define AppExeName "ChordRadarAdmin.Views.exe"
#define BuildDir "../ChordRadarAdmin.Views/bin/Debug/net9.0-windows"
#define AppIconFile "../ChordRadarAdmin.Core/chordradar.ico"

[Setup]
AppId={{3A0D8A8C-2C6D-4A25-9C8A-0D9A9F7E4C1D}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
DisableDirPage=no
OutputDir=../build
OutputBaseFilename=ChordRadarAdminSetup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
SetupIconFile={#AppIconFile}
UninstallDisplayIcon={app}\{#AppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "{#BuildDir}/*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{commondesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch {#AppName}"; Flags: nowait postinstall skipifsilent
