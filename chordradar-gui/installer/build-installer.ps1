$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$issPath = Join-Path $PSScriptRoot 'ChordRadarAdmin.iss'
$expectedBuildDir = Join-Path $repoRoot 'ChordRadarAdmin.Views\bin\Debug\net9.0-windows'

if (-not (Test-Path $expectedBuildDir)) {
    throw "Build output not found at $expectedBuildDir. Run 'dotnet build ChordRadarAdmin.sln' first."
}

$compilerCandidates = @(
    'iscc.exe',
    'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
    'C:\Program Files\Inno Setup 6\ISCC.exe',
    'C:\Users\galak\AppData\Local\Programs\Inno Setup 6\ISCC.exe'
)

$iscc = $null
foreach ($candidate in $compilerCandidates) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($command) {
        $iscc = $command.Source
        break
    }
}

if (-not $iscc) {
    throw 'Inno Setup compiler (ISCC.exe) was not found. Install Inno Setup 6, then run this script again.'
}

& $iscc $issPath
