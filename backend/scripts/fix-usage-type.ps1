# Script de correction automatique pour migration UsageType -> usageId
# À exécuter depuis d:\house_md\cbc\backend

$files = @(
    "src\pricing-engine\pricing-engine.service.ts",
    "src\pricing-engine\reduction-rates.service.ts",
    "src\pricing-rules\dc-config.service.ts",
    "src\pricing-rules\dc-config.controller.ts",
    "src\convention-reduction-rules\convention-reduction-rules.service.ts",
    "src\convention-reduction-rules\convention-reduction-rules.controller.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Supprimer import UsageType
        $content = $content -replace ", UsageType", ""
        $content = $content -replace "UsageType, ", ""
        $content = $content -replace "import \{ UsageType \} from '@prisma/client';`r?`n", ""
        
        # Remplacer usageType par usageId dans les objets
        $content = $content -replace "usageType:", "usageId:"
        $content = $content -replace "usageType\s*=", "usageId ="
        $content = $content -replace "usageType\?:", "usageId?:"
        $content = $content -replace "\.usageType", ".usageId"
        $content = $content -replace "companyId_usageType", "companyId_usageId"
        
        Set-Content $path $content -NoNewline
        Write-Host "✅ Corrigé: $file"
    } else {
        Write-Host "⚠️ Fichier non trouvé: $file"
    }
}

Write-Host "`n✅ Correction terminée!"
