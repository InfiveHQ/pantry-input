# Backup script with full path to pg_dump
$pgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
$password = "QdaQcfVaqTmGyLi5"
$projectRef = "vshtpwneyrfujwesrxeu"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "supabase_backup_$timestamp.dump"

Write-Host "=== Supabase Database Backup ===" -ForegroundColor Green
Write-Host "Using pg_dump from: $pgDumpPath" -ForegroundColor Cyan
Write-Host "Project Reference: $projectRef" -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump exists
if (Test-Path $pgDumpPath) {
    Write-Host "✅ pg_dump found" -ForegroundColor Green
} else {
    Write-Host "❌ pg_dump not found at: $pgDumpPath" -ForegroundColor Red
    exit 1
}

# Run the backup
Write-Host "Creating backup..." -ForegroundColor Yellow
$connectionString = "postgresql://postgres:$password@db.$projectRef.supabase.co:5432/postgres"

try {
    & $pgDumpPath --clean --if-exists --format=c --no-owner --no-privileges --dbname="$connectionString" > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        Write-Host "Backup file: $backupFile" -ForegroundColor Green
        
        # Show file size
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length
            Write-Host "File size: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "1. Wrong password - check your Supabase dashboard"
        Write-Host "2. IP not allowed - add your IP to Supabase dashboard"
        Write-Host "3. Network connectivity issues"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 