# Push GameTeaser to GitHub (Redevil12)
# 1. Create empty repo: https://github.com/new?name=gameteaser&description=GameTeaser+countdown+hub
# 2. Run this script in PowerShell

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;" + $env:Path

$repo = "https://github.com/Redevil12/gameteaser.git"
Set-Location $PSScriptRoot

if (-not (Test-Path .git)) {
  git init -b main
  git add -A
  git commit -m "Initial commit: GameTeaser"
}

$remotes = git remote 2>$null
if ($remotes -notcontains "origin") {
  git remote add origin $repo
} else {
  git remote set-url origin $repo
}

Write-Host "Pushing to $repo ..."
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nDone! https://github.com/Redevil12/gameteaser"
} else {
  Write-Host "`nIf auth failed:"
  Write-Host "  - Create repo first: https://github.com/new (name: gameteaser, no README)"
  Write-Host "  - Sign in: Git Credential Manager should open in browser"
  Write-Host "  - Or use PAT: git remote set-url origin https://YOUR_TOKEN@github.com/Redevil12/gameteaser.git"
}
