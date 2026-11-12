$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$csvPath = 'docs/gestao/jira-import.csv'
$null = [Text.UTF8Encoding]::new($false, $true).GetString([IO.File]::ReadAllBytes((Join-Path (Get-Location) $csvPath)))
$rows = @(Import-Csv -LiteralPath $csvPath -Encoding UTF8)
$expectedHeaders = @('Work item ID', 'Work type', 'Summary', 'Description', 'Parent', 'Priority', 'Status', 'Labels')
if (($rows[0].PSObject.Properties.Name -join '|') -ne ($expectedHeaders -join '|')) { throw 'Cabecalho CSV inesperado.' }
if ($rows.Count -ne 30) { throw 'O CSV deve preservar os 30 registros.' }
$ids = @{}; $localIds = @{}; $dependencies = @{}; $counts = @{}
foreach ($row in $rows) {
    $id = $row.'Work item ID'
    if ($id -notmatch '^[1-9][0-9]*$' -or $ids.ContainsKey($id)) { throw "ID invalido/duplicado: $id" }
    foreach ($field in @('Work type','Summary','Description','Priority','Status','Labels')) {
        if ([string]::IsNullOrWhiteSpace($row.$field)) { throw "Campo vazio: $id/$field" }
    }
    if ($row.Summary.Length -gt 255) { throw "Summary excede 255 caracteres: $id" }
    if ($row.'Work type' -notin @('Epic','Story','Task','Bug')) { throw "Tipo inesperado: $id" }
    if ($row.Priority -notin @('Highest','High','Medium') -or $row.Status -ne 'To Do' -or $row.Labels -ne 'cinemax-gestao') { throw "Mapeamento inesperado: $id" }
    $local = [regex]::Match($row.Summary, '^\[CMX-((?:EP|US|TK|BUG)\d{2})\] ').Groups[1].Value
    if (!$local -or $localIds.ContainsKey($local) -or $row.Description -notmatch "ID local: $local(?:;|\s|$)") { throw "ID local inconsistente: $id" }
    if ($row.'Work type' -eq 'Epic') {
        if ($row.Parent) { throw "Epic com pai inesperado: $local" }
    } else {
        if (!$ids.ContainsKey($row.Parent) -or $ids[$row.Parent].'Work type' -ne 'Epic') { throw "Pai ausente/fora de ordem: $local" }
        $epic = [regex]::Match($ids[$row.Parent].Summary, 'CMX-(EP\d+)').Groups[1].Value
        if ($row.Description -notmatch "[e\u00e9]pico: $epic") { throw "Epico divergente: $local" }
        $priority = [regex]::Match($row.Description, 'Prioridade proposta: (P[012])').Groups[1].Value
        if (!$priority -or $row.Priority -ne @{P0='Highest';P1='High';P2='Medium'}[$priority]) { throw "Prioridade divergente: $local" }
        if ($row.Description -notmatch 'Crit\u00e9rios de aceite:' -or $row.Description -notmatch 'Estimativa proposta:') { throw "Aceite/estimativa ausente: $local" }
        $dep = [regex]::Match($row.Description, 'Depend\u00eancias locais: ([^.]+)\.').Groups[1].Value
        if (!$dep) { throw "Dependencias ausentes: $local" }
        $dependencies[$local] = @($(if ($dep -ne 'nenhuma') { $dep -split ',\s*' }))
    }
    $ids[$id] = $row; $localIds[$local] = $row
    $counts[$row.'Work type']++
}
foreach ($type in @('Epic','Story','Task','Bug')) {
    if ($counts[$type] -ne @{Epic=6;Story=16;Task=6;Bug=2}[$type]) { throw "Contagem incorreta: $type" }
}
$backlogItems = @(Get-Content docs/gestao/PRODUCT_BACKLOG.md -Encoding UTF8 | Where-Object { $_ -match '^\| \d+ \| (US|TK|BUG)\d+ \|' })
if ($backlogItems.Count -ne 24) { throw 'Backlog deve conter os mesmos 24 itens filhos.' }
foreach ($line in $backlogItems) {
    $parts = @($line.Split('|') | ForEach-Object { $_.Trim() })
    $row = $localIds[$parts[2]]
    if (!$row -or $row.'Work type' -ne $parts[3] -or $row.Description -notmatch "[e\u00e9]pico: $($parts[4])" -or $row.Priority -ne @{P0='Highest';P1='High';P2='Medium'}[$parts[5]]) { throw "Backlog divergente: $($parts[2])" }
    $expectedDeps = @($(if ($parts[7] -match '^(US|TK|BUG)') { $parts[7] -split ',\s*' }))
    if (($expectedDeps -join ',') -ne ($dependencies[$parts[2]] -join ',')) { throw "Dependencias divergentes: $($parts[2])" }
    if (!$row.Description.Contains("lan$([char]0x00e7)ada: $($parts[8]).")) { throw "Versao proposta divergente: $($parts[2])" }
}
$visiting = @{}; $visited = @{}; $order = [Collections.Generic.List[string]]::new()
function Visit-Dependency([string]$local) {
    if ($visiting[$local]) { throw "Ciclo de dependencias: $local" }
    if ($visited[$local]) { return }
    $visiting[$local] = $true
    foreach ($dependency in $dependencies[$local]) {
        if (!$localIds.ContainsKey($dependency)) { throw "Dependencia inexistente: $local -> $dependency" }
        Visit-Dependency $dependency
    }
    $visiting[$local] = $false; $visited[$local] = $true; $order.Add($local)
}
foreach ($row in $rows | Where-Object { $_.'Work type' -ne 'Epic' }) {
    Visit-Dependency ([regex]::Match($row.Summary, 'CMX-([^\]]+)').Groups[1].Value)
}
$result = [ordered]@{
    checkedAt = [DateTime]::UtcNow.ToString('o'); file = $csvPath
    sha256 = (Get-FileHash $csvPath -Algorithm SHA256).Hash.ToLowerInvariant()
    records = $rows.Count; types = $counts; dependencyEdges = @($dependencies.Values | ForEach-Object { $_ }).Count
    dependencyCycles = 0; validDependencyOrder = @($order); result = 'passed-local'
    destinationValidated = $false; issuesCreated = 0
    limits = @('Jira ainda nao configurado; campos adicionais obrigatorios, tipos, status e prioridades precisam ser conciliados no destino.', 'Dependencias na Description nao criam links Jira.', 'IDs e To Do sao propostas locais, nao chaves ou historico real.')
}
New-Item -ItemType Directory -Force docs/evidencias/complementacao | Out-Null
$json = $result | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path (Get-Location) 'docs/evidencias/complementacao/jira-csv.json'), $json + "`n", [Text.UTF8Encoding]::new($false))
$json
