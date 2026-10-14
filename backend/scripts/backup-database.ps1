param(
  [string]$BackupDirectory = (Join-Path $PSScriptRoot '..\..\backups'),
  [int]$RetentionDays = 30,
  [string]$Container = 'personal-dashboard-db',
  [string]$Database = 'personal_dashboard',
  [string]$DatabaseUser = 'dashboard'
)

$ErrorActionPreference = 'Stop'
$resolvedBackupDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
[System.IO.Directory]::CreateDirectory($resolvedBackupDirectory) | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$fileName = "personal-dashboard-$stamp.dump"
$containerFile = "/tmp/$fileName"
$localFile = Join-Path $resolvedBackupDirectory $fileName

try {
  docker exec $Container pg_dump --username=$DatabaseUser --dbname=$Database --format=custom --file=$containerFile
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }
  docker cp "${Container}:${containerFile}" $localFile
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the backup from PostgreSQL.' }
} finally {
  docker exec $Container rm -f $containerFile 2>$null | Out-Null
}

if (!(Test-Path -LiteralPath $localFile) -or (Get-Item -LiteralPath $localFile).Length -eq 0) {
  throw 'The backup file was not created or is empty.'
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $resolvedBackupDirectory -Filter 'personal-dashboard-*.dump' -File |
  Where-Object LastWriteTime -lt $cutoff |
  Remove-Item -Force

Write-Output $localFile
