# Simple Supabase Backup Command
# Your project reference: vshtpwneyrfujwesrxeu

Write-Host "=== Supabase Database Backup ===" -ForegroundColor Green
Write-Host "Project Reference: vshtpwneyrfujwesrxeu" -ForegroundColor Cyan
Write-Host ""

# Get database password
Write-Host "Please enter your Supabase database password:" -ForegroundColor Yellow
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Create backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "supabase_backup_$timestamp.dump"

Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Yellow
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

# Run pg_dump command
$connectionString = "postgresql://postgres:$passwordPlain@db.vshtpwneyrfujwesrxeu.supabase.co:5432/postgres"

try {
    pg_dump --clean --if-exists --format=c --no-owner --no-privileges --dbname="$connectionString" > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        Write-Host "Backup file: $backupFile" -ForegroundColor Green
        
        # Show file size
        $fileSize = (Get-Item $backupFile).Length
        Write-Host "File size: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "1. Wrong password - check your Supabase dashboard"
        Write-Host "2. IP not allowed - add your IP to Supabase dashboard"
        Write-Host "3. pg_dump not in PATH - make sure PostgreSQL is installed"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 