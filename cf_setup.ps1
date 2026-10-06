$token = "cfoat_C83ZDz6_gouSb5KVsPCpETK37QOFB3lGtUjuoexrQ5M.mR8Nkh00LjTRfguotNd0p8bDCxHffo0zGyzGsRbJMA4"
$accountId = "fc53b6fd613df944a3a46606cfbf21d0"
$headers = @{ 
    "Authorization" = "Bearer $token" 
    "Content-Type" = "application/json"
}

$dbUrl = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
$authSecret = "ok_prod_sec_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
$rzpId = "rzp_test_ThZQYSrCMZzM4a"
$rzpSecret = "9P87Xpc40k1iTf0iuszlf5A5"

$projects = @(
    "orderking-customers",
    "orderking-hdmaster",
    "orderking-riders",
    "orderking-partners",
    "apps-integration"
)

foreach ($proj in $projects) {
    Write-Host "Configuring $proj..."
    
    $envVars = @{
        "DATABASE_URL" = @{ "type" = "secret_text"; "value" = $dbUrl }
        "BETTER_AUTH_SECRET" = @{ "type" = "secret_text"; "value" = $authSecret }
        "BETTER_AUTH_URL" = @{ "type" = "plain_text"; "value" = "https://$proj.pages.dev" }
        "VITE_AUTH_ENABLED" = @{ "type" = "plain_text"; "value" = "true" }
        "NODE_ENV" = @{ "type" = "plain_text"; "value" = "production" }
    }

    if ($proj -eq "orderking-customers" -or $proj -eq "apps-integration" -or $proj -eq "orderking-partners" -or $proj -eq "orderking-hdmaster") {
        $envVars["RAZORPAY_KEY_ID"] = @{ "type" = "plain_text"; "value" = $rzpId }
        $envVars["RAZORPAY_KEY_SECRET"] = @{ "type" = "secret_text"; "value" = $rzpSecret }
    }

    $body = @{
        "production_branch" = "main"
        "deployment_configs" = @{
            "production" = @{ "env_vars" = $envVars }
            "preview" = @{ "env_vars" = $envVars }
        }
    } | ConvertTo-Json -Depth 5

    # 1. Update Project
    $url = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$proj"
    try {
        $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Patch -Body $body
        Write-Host "  -> Updated settings successfully."
    } catch {
        Write-Host "  -> Failed to update settings: $_"
    }

    # 2. Trigger Deployment
    Write-Host "  -> Triggering new deployment..."
    $deployUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$proj/deployments"
    try {
        $deployBody = @{ "branch" = "main" } | ConvertTo-Json
        $resDeploy = Invoke-RestMethod -Uri $deployUrl -Headers $headers -Method Post -Body $deployBody
        Write-Host "  -> Deployment triggered!"
    } catch {
        Write-Host "  -> Failed to trigger deploy: $_"
    }
}
Write-Host "All done!"
