param(
  [string]$Container = 'personal-dashboard-db',
  [string]$Database = 'personal_dashboard',
  [string]$DatabaseUser = 'dashboard'
)

$ErrorActionPreference = 'Stop'
$temporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "dashboard-backup-test-$([guid]::NewGuid().ToString('N'))"
$restoreDatabase = "dashboard_restore_test_$([guid]::NewGuid().ToString('N').Substring(0, 12))"
$containerFile = "/tmp/$restoreDatabase.dump"

try {
  New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
  $backupFile = & (Join-Path $PSScriptRoot 'backup-database.ps1') -BackupDirectory $temporaryDirectory -RetentionDays 30 -Container $Container -Database $Database -DatabaseUser $DatabaseUser
  if ($LASTEXITCODE -ne 0) { throw 'Creating the test backup failed.' }

  docker cp $backupFile "${Container}:${containerFile}"
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the backup into PostgreSQL.' }
  docker exec $Container createdb --username=$DatabaseUser $restoreDatabase
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the isolated restore database.' }
  docker exec $Container pg_restore --username=$DatabaseUser --dbname=$restoreDatabase --exit-on-error $containerFile
  if ($LASTEXITCODE -ne 0) { throw 'Restoring the backup failed.' }

  $eventTableCount = docker exec $Container psql --username=$DatabaseUser --dbname=$restoreDatabase --tuples-only --no-align --command="SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Event';"
  if ($LASTEXITCODE -ne 0 -or $eventTableCount.Trim() -ne '1') {
    throw 'Restore verification failed: the Event table was not found.'
  }
  Write-Output "Backup restored and verified in isolated database $restoreDatabase."
} finally {
  docker exec $Container dropdb --username=$DatabaseUser --if-exists --force $restoreDatabase 2>$null | Out-Null
  docker exec $Container rm -f $containerFile 2>$null | Out-Null
  if (Test-Path -LiteralPath $temporaryDirectory) {
    Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
  }
}
