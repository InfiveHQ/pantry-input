# Supabase Database Backup Script
# This script helps you create a backup of your Supabase database

Write-Host "=== Supabase Database Backup Script ===" -ForegroundColor Green
Write-Host ""

# Get Supabase project details
Write-Host "Please provide your Supabase project details:" -ForegroundColor Yellow
$projectRef = Read-Host "Enter your Supabase project reference (e.g., abcdefghijklmnop)"
$password = Read-Host "Enter your Supabase database password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Construct the connection string
$connectionString = "postgresql://postgres:$passwordPlain@db.$projectRef.supabase.co:5432/postgres"

# Create backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "supabase_backup_$timestamp.dump"

Write-Host ""
Write-Host "Creating backup with the following details:" -ForegroundColor Cyan
Write-Host "Project Reference: $projectRef"
Write-Host "Backup File: $backupFile"
Write-Host ""

# Run pg_dump command
Write-Host "Running pg_dump command..." -ForegroundColor Yellow
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
    }
} catch {
    Write-Host "❌ Error running pg_dump: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure pg_dump is in your PATH"
    Write-Host "2. Verify your Supabase project reference and password"
    Write-Host "3. Check your internet connection"
    Write-Host "4. Ensure your IP is allowed in Supabase dashboard"
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 