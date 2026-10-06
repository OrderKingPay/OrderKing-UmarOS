$token = 'cfoat_C83ZDz6_gouSb5KVsPCpETK37QOFB3lGtUjuoexrQ5M.mR8Nkh00LjTRfguotNd0p8bDCxHffo0zGyzGsRbJMA4'
$accountId = 'fc53b6fd613df944a3a46606cfbf21d0'
$headers = @{ 'Authorization' = 'Bearer ' + $token; 'Content-Type' = 'application/json' }

$dbUrl = (Get-Content .env | Select-String 'DATABASE_URL' | ForEach-Object { $_.Line.Split('=', 2)[1].Trim('"''') })
$authSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

$projects = @('orderking-customers', 'orderking-hdmaster', 'orderking-riders', 'orderking-partners', 'apps-integration')

foreach ($proj in $projects) {
    Write-Host "Updating $proj env vars..."
    $url = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$proj"
    
    try {
        $currentProject = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        $vars = $currentProject.result.deployment_configs.production.env_vars
        
        # Convert PSCustomObject to Hashtable
        $newVars = @{}
        foreach ($prop in $vars.psobject.properties) {
            $newVars[$prop.Name] = $prop.Value
        }

        $newVars['DATABASE_URL'] = @{ 'type' = 'secret_text'; 'value' = $dbUrl }
        $newVars['BETTER_AUTH_SECRET'] = @{ 'type' = 'secret_text'; 'value' = $authSecret }
        
        $body = @{
            'deployment_configs' = @{
                'production' = @{ 'env_vars' = $newVars }
                'preview' = @{ 'env_vars' = $newVars }
            }
        } | ConvertTo-Json -Depth 5

        Invoke-RestMethod -Uri $url -Headers $headers -Method Patch -Body $body > $null
        Write-Host "Triggering new deployment for $proj..."
        
        $deployUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$proj/deployments"
        Invoke-RestMethod -Uri $deployUrl -Headers $headers -Method Post > $null
        Write-Host "Success for $proj!"
    } catch {
        Write-Host "Failed $proj : $($_.Exception.Message)"
    }
}
