$ErrorActionPreference = "Stop"

$ProjectId = "project-274651c6-ae46-4f15-b82"
$Region = "asia-south1"
$Repository = "orderking"
$RequiredBranch = "cloudrun/production-bootstrap-2026-09-30"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud CLI is not installed or not on PATH."
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is not installed or not on PATH."
}

$branch = (git branch --show-current).Trim()
if ($branch -ne $RequiredBranch) {
  throw "Wrong branch: $branch. Checkout $RequiredBranch before deploying."
}

$account = (gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null | Select-Object -First 1).Trim()
if ([string]::IsNullOrWhiteSpace($account)) {
  throw "No active gcloud account. Run: gcloud auth login"
}

$currentProject = (gcloud config get-value project 2>$null).Trim()
if ($currentProject -ne $ProjectId) {
  gcloud config set project $ProjectId | Out-Host
}

Write-Host "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=$ProjectId | Out-Host

Write-Host "Checking Artifact Registry repository..."
gcloud artifacts repositories describe $Repository --location=$Region --project=$ProjectId *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating Artifact Registry repository $Repository..."
  gcloud artifacts repositories create $Repository --repository-format=docker --location=$Region --description="OrderKing Cloud Run production images" --project=$ProjectId | Out-Host
}

Write-Host ""
Write-Host "Starting ONE Cloud Build deployment for all five OrderKing services..."
Write-Host "Project : $ProjectId"
Write-Host "Region  : $Region"
Write-Host "Branch  : $RequiredBranch"
Write-Host ""

gcloud builds submit --project=$ProjectId --region=$Region --config=cloudbuild.yaml .
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Build failed. No deployment success is reported."
}