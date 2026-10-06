$token = "cfoat_C83ZDz6_gouSb5KVsPCpETK37QOFB3lGtUjuoexrQ5M.mR8Nkh00LjTRfguotNd0p8bDCxHffo0zGyzGsRbJMA4"
$accountId = "fc53b6fd613df944a3a46606cfbf21d0"
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "==================================================="
Write-Host " ONE-SHOT CLOUDFLARE INJECTOR (FIXED)"
Write-Host "==================================================="
Write-Host "Leave blank and press Enter to skip any key."

$openai = Read-Host "Paste OPENAI_API_KEY"
$rzpLiveId = Read-Host "Paste LIVE RAZORPAY_KEY_ID (rzp_live_...)"
$rzpLiveSecret = Read-Host "Paste LIVE RAZORPAY_KEY_SECRET"

$projects = @("orderking-customers", "orderking-hdmaster", "orderking-riders", "orderking-partners", "apps-integration")

foreach ($proj in $projects) {
    Write-Host "`nUpdating $proj..."

    $url = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$proj"
    $currentProject = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    
    # Convert PSCustomObject to Hashtable safely
    $prodVars = @{}
    $currentProd = $currentProject.result.deployment_configs.production.env_vars
    if ($currentProd) { foreach ($p in $currentProd.psobject.properties) { $prodVars[$p.Name] = $p.Value } }
    
    $previewVars = @{}
    $currentPreview = $currentProject.result.deployment_configs.preview.env_vars
    if ($currentPreview) { foreach ($p in $currentPreview.psobject.properties) { $previewVars[$p.Name] = $p.Value } }

    # Add new keys
    if ($openai) {
        $prodVars["OPENAI_API_KEY"] = @{ "type" = "secret_text"; "value" = $openai }
        $previewVars["OPENAI_API_KEY"] = @{ "type" = "secret_text"; "value" = $openai }
    }
    
    if ($rzpLiveId -and $rzpLiveSecret) {
        if ($proj -in @("orderking-customers", "apps-integration", "orderking-partners", "orderking-hdmaster")) {
            $prodVars["RAZORPAY_KEY_ID"] = @{ "type" = "plain_text"; "value" = $rzpLiveId }
            $prodVars["RAZORPAY_KEY_SECRET"] = @{ "type" = "secret_text"; "value" = $rzpLiveSecret }
            $previewVars["RAZORPAY_KEY_ID"] = @{ "type" = "plain_text"; "value" = $rzpLiveId }
            $previewVars["RAZORPAY_KEY_SECRET"] = @{ "type" = "secret_text"; "value" = $rzpLiveSecret }
        }
    }

    $body = @{
        "deployment_configs" = @{
            "production" = @{ "env_vars" = $prodVars }
            "preview" = @{ "env_vars" = $previewVars }
        }
    } | ConvertTo-Json -Depth 5

    try {
        $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Patch -Body $body
        Write-Host "  -> Successfully injected new keys!"
    } catch {
        Write-Host "  -> Failed to update: $_"
    }
}
Write-Host "`nAll keys injected perfectly!"
