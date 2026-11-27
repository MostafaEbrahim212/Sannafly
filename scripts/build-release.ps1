param(
    [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
$ReleaseDir = Join-Path $Root "release"
$StagingReady = Join-Path $ReleaseDir "_staging_ready"
$StagingDev = Join-Path $ReleaseDir "_staging_dev"

Write-Host "Building Commercial Release v$Version..." -ForegroundColor Cyan

# Ensure frontend assets are freshly built
Push-Location $Root
npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed." }
Pop-Location

# Reset staging folders
if (Test-Path $StagingReady) { Remove-Item $StagingReady -Recurse -Force }
if (Test-Path $StagingDev) { Remove-Item $StagingDev -Recurse -Force }
New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
New-Item -ItemType Directory -Path $StagingReady -Force | Out-Null
New-Item -ItemType Directory -Path $StagingDev -Force | Out-Null

# 1. Copy Ready-to-Upload package (includes vendor + public/build, excludes .env, .git, node_modules, logs, installed lock, tests, release)
robocopy $Root $StagingReady /E /NFL /NDL /NJH /NJS /XD ".git" "node_modules" "release" "commercial-readiness" "tests" "playwright-report" "test-results" ".phpunit.cache" /XF ".env" "*.log" "installed" ".env.backup.*" | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingReady "storage\logs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingReady "storage\app\public") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingReady "bootstrap\cache") -Force | Out-Null

$ReadyZip = Join-Path $ReleaseDir "catalogflow-v$Version-ready-to-upload.zip"
if (Test-Path $ReadyZip) { Remove-Item $ReadyZip -Force }
Compress-Archive -Path "$StagingReady\*" -DestinationPath $ReadyZip -CompressionLevel Optimal

# 2. Copy Developer package (clean source + tests, excludes vendor, node_modules, .env, .git)
robocopy $Root $StagingDev /E /NFL /NDL /NJH /NJS /XD ".git" "node_modules" "vendor" "release" "commercial-readiness" "playwright-report" "test-results" ".phpunit.cache" /XF ".env" "*.log" "installed" ".env.backup.*" | Out-Null

$DevZip = Join-Path $ReleaseDir "catalogflow-v$Version-developer.zip"
if (Test-Path $DevZip) { Remove-Item $DevZip -Force }
Compress-Archive -Path "$StagingDev\*" -DestinationPath $DevZip -CompressionLevel Optimal

# 3. Copy standalone documentation & metadata into release/
$DocsOut = Join-Path $ReleaseDir "docs"
if (Test-Path $DocsOut) { Remove-Item $DocsOut -Recurse -Force }
Copy-Item (Join-Path $Root "docs") $DocsOut -Recurse -Force
Copy-Item (Join-Path $Root "CHANGELOG.md") (Join-Path $ReleaseDir "CHANGELOG.md") -Force
Copy-Item (Join-Path $Root "LICENSE.md") (Join-Path $ReleaseDir "LICENSE.md") -Force
Copy-Item (Join-Path $Root "README.md") (Join-Path $ReleaseDir "README.md") -Force

# Cleanup staging
Remove-Item $StagingReady -Recurse -Force
Remove-Item $StagingDev -Recurse -Force

Write-Host "Created:" -ForegroundColor Green
Write-Host " - $ReadyZip"
Write-Host " - $DevZip"
