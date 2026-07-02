param(
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot "Bedrock_Evolved.mcaddon"
}

$packs = @(
  @{
    Source = Join-Path $repoRoot "behavior_packs\WorldUpliftBP"
    Root = "WorldUpliftBP"
  },
  @{
    Source = Join-Path $repoRoot "resource_packs\WorldUpliftRP"
    Root = "WorldUpliftRP"
  }
)

foreach ($pack in $packs) {
  $manifest = Join-Path $pack.Source "manifest.json"
  if (-not (Test-Path -LiteralPath $manifest)) {
    throw "Missing manifest: $manifest"
  }

  Get-Content -Raw -LiteralPath $manifest | ConvertFrom-Json | Out-Null
}

$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDir = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($resolvedOutput, [System.IO.Compression.ZipArchiveMode]::Create)

try {
  foreach ($pack in $packs) {
    $sourceRoot = (Resolve-Path -LiteralPath $pack.Source).Path
    $files = Get-ChildItem -LiteralPath $sourceRoot -Recurse -File

    foreach ($file in $files) {
      $relative = $file.FullName.Substring($sourceRoot.Length).TrimStart([char[]]@("\", "/"))
      $entryName = ($pack.Root + "/" + ($relative -replace "\\", "/"))
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip,
        $file.FullName,
        $entryName,
        [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
  }
}
finally {
  $zip.Dispose()
}

Write-Host "Created $resolvedOutput"
