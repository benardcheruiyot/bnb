param(
    [Parameter(Mandatory = $true)]
    [string]$VpsHost,

    [Parameter(Mandatory = $true)]
    [string]$VpsUser,

    [Parameter(Mandatory = $true)]
    [string]$SshKeyFile,

    [Parameter(Mandatory = $true)]
    [string]$CertbotEmail,

    [Parameter(Mandatory = $true)]
    [string]$ProdDomain,

    [Parameter(Mandatory = $true)]
    [string]$StagingDomain,

    [string]$Repo,
    [string]$DeployRepo,
    [string]$ProdPath = "/var/www/talaextra-5004",
    [string]$StagingPath = "/var/www/talaextra-5005",
    [string]$ProdBranch = "main",
    [string]$StagingBranch = "staging",
    [string]$BackendEnvFile = "backend/.env",
    [string]$FrontendEnvFile = "frontend/.env",
    [string]$BackendStagingEnvFile = "backend/.env.staging",
    [string]$FrontendStagingEnvFile = "frontend/.env.staging"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command: $Name"
    }
}

function Upsert-EnvLine {
    param(
        [string]$Text,
        [string]$Key,
        [string]$Value
    )

    $pattern = "(?m)^$([Regex]::Escape($Key))=.*$"
    $newLine = "$Key=$Value"

    if ($Text -match $pattern) {
        return [Regex]::Replace($Text, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newLine })
    }

    if ($Text.Length -gt 0 -and -not $Text.EndsWith("`n")) {
        return "$Text`n$newLine"
    }

    return "$Text$newLine"
}

Require-Command "gh"
Require-Command "git"

if (-not (Test-Path $SshKeyFile)) {
    throw "SSH key file not found: $SshKeyFile"
}

if (-not (Test-Path $BackendEnvFile) -or -not (Test-Path $FrontendEnvFile)) {
    throw "Missing production env files. Expected: $BackendEnvFile and $FrontendEnvFile"
}

if (-not $Repo) {
    $originUrl = (git config --get remote.origin.url)
    if ($originUrl -match "github.com[:/]([^/]+/[^/.]+)(\.git)?$") {
        $Repo = $Matches[1]
    }
}

if (-not $Repo) {
    throw "Could not determine GitHub repo. Provide -Repo owner/repo"
}

if (-not $DeployRepo) {
    $DeployRepo = (git config --get remote.origin.url)
}

$prodBackendContent = Get-Content -Raw -Path $BackendEnvFile
$prodFrontendContent = Get-Content -Raw -Path $FrontendEnvFile
$sshKeyContent = Get-Content -Raw -Path $SshKeyFile

if (Test-Path $BackendStagingEnvFile) {
    $stagingBackendContent = Get-Content -Raw -Path $BackendStagingEnvFile
} else {
    $stagingBackendContent = $prodBackendContent
}

if (Test-Path $FrontendStagingEnvFile) {
    $stagingFrontendContent = Get-Content -Raw -Path $FrontendStagingEnvFile
} else {
    $stagingFrontendContent = $prodFrontendContent
}

$stagingBackendContent = Upsert-EnvLine -Text $stagingBackendContent -Key "NODE_ENV" -Value "production"
$stagingBackendContent = Upsert-EnvLine -Text $stagingBackendContent -Key "ALLOWED_ORIGINS" -Value "https://$StagingDomain,https://www.$StagingDomain"
$stagingBackendContent = Upsert-EnvLine -Text $stagingBackendContent -Key "ALLOWED_BASE_DOMAIN" -Value $StagingDomain
$stagingBackendContent = Upsert-EnvLine -Text $stagingBackendContent -Key "APP_PUBLIC_URL" -Value "https://$StagingDomain"
$stagingBackendContent = Upsert-EnvLine -Text $stagingBackendContent -Key "MPESA_CALLBACK_URL" -Value "https://$StagingDomain/api/mpesa/callback"
$stagingFrontendContent = Upsert-EnvLine -Text $stagingFrontendContent -Key "REACT_APP_API_URL" -Value "https://$StagingDomain/api"

# Ensure environments exist
gh api -X PUT "repos/$Repo/environments/production" | Out-Null
gh api -X PUT "repos/$Repo/environments/staging" | Out-Null

# Production secrets
$VpsHost | gh secret set VPS_HOST --env production --repo $Repo
$VpsUser | gh secret set VPS_USER --env production --repo $Repo
$sshKeyContent | gh secret set VPS_SSH_KEY --env production --repo $Repo
$prodBackendContent | gh secret set BACKEND_ENV_FILE --env production --repo $Repo
$prodFrontendContent | gh secret set FRONTEND_ENV_FILE --env production --repo $Repo

# Staging secrets
$VpsHost | gh secret set VPS_HOST --env staging --repo $Repo
$VpsUser | gh secret set VPS_USER --env staging --repo $Repo
$sshKeyContent | gh secret set VPS_SSH_KEY --env staging --repo $Repo
$stagingBackendContent | gh secret set BACKEND_ENV_FILE --env staging --repo $Repo
$stagingFrontendContent | gh secret set FRONTEND_ENV_FILE --env staging --repo $Repo

# Production variables
$ProdDomain | gh variable set APP_DOMAIN --env production --repo $Repo
$CertbotEmail | gh variable set CERTBOT_EMAIL --env production --repo $Repo
$ProdPath | gh variable set DEPLOY_PATH --env production --repo $Repo
$ProdBranch | gh variable set DEPLOY_BRANCH --env production --repo $Repo
if ($DeployRepo) {
    $DeployRepo | gh variable set DEPLOY_REPO --env production --repo $Repo
}

# Staging variables
$StagingDomain | gh variable set APP_DOMAIN --env staging --repo $Repo
$CertbotEmail | gh variable set CERTBOT_EMAIL --env staging --repo $Repo
$StagingPath | gh variable set DEPLOY_PATH --env staging --repo $Repo
$StagingBranch | gh variable set DEPLOY_BRANCH --env staging --repo $Repo
if ($DeployRepo) {
    $DeployRepo | gh variable set DEPLOY_REPO --env staging --repo $Repo
}

Write-Output "GitHub environments configured successfully for repo: $Repo"
Write-Output "Production deploy: push to main or run Deploy Production workflow"
Write-Output "Staging deploy: push to staging or run Deploy Staging workflow"
