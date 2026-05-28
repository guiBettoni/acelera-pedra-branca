param(
  [switch]$Install,
  [int]$Port = 3000
)

if ($Install) {
  Write-Host "Installing npm dependencies..."
  Push-Location backend
  npm install
  Pop-Location
}

Write-Host "Copying .env.example to .env if missing..."
if (-Not (Test-Path 'backend\.env')) {
  Copy-Item 'backend\.env.example' 'backend\.env'
  Write-Host ".env created. Please edit backend\\.env with your SUPABASE values."
} else {
  Write-Host ".env exists; not overwriting."
}

Write-Host "Starting server (PORT=$Port)..."
Push-Location backend
$env:PORT = $Port
npm start
Pop-Location
