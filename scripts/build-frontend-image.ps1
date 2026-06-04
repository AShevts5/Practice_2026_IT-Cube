param(
  [string]$VpsHost = "root@168.222.140.209",
  [string]$ImageTag = "org-frontend:latest"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location (Join-Path $Root "Frontend")
try {
  $env:DOCKER_BUILDKIT = "1"
  docker build -t $ImageTag --build-arg VITE_API_BASE_URL=/api/v1 .
  if ($LASTEXITCODE -ne 0) {
    throw "docker build failed with exit code $LASTEXITCODE"
  }
  $tar = Join-Path $env:TEMP "org-frontend.tar"
  docker save $ImageTag -o $tar
  Write-Host "→ scp $tar → ${VpsHost}:/tmp/org-frontend.tar"
  scp $tar "${VpsHost}:/tmp/org-frontend.tar"
  Write-Host @"

На VPS выполните:
  docker load -i /tmp/org-frontend.tar
  cd /opt/Practice_2026_IT-Cube
  docker compose -f docker-compose.prod.yml up -d --no-build frontend

"@
} finally {
  Pop-Location
}
