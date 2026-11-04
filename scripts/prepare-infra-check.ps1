$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path '.env.infra-check')) {
    $content = (Get-Content .env.example -Raw).
        Replace('DB_ROOT_PASSWORD=change_me', 'DB_ROOT_PASSWORD=' + [guid]::NewGuid().ToString('N')).
        Replace('DB_PASS=change_me', 'DB_PASS=' + [guid]::NewGuid().ToString('N')).
        Replace('CACHE_TTL_SECONDS=60', 'CACHE_TTL_SECONDS=3').
        Replace('ENV_FILE=.env', 'ENV_FILE=.env.infra-check').
        Replace('JWT_SECRET=change_me_use_a_long_random_secret', 'JWT_SECRET=' + [guid]::NewGuid().ToString('N'))
    [IO.File]::WriteAllText((Join-Path (Get-Location) '.env.infra-check'), $content)
}
New-Item -ItemType Directory -Path certs/local -Force | Out-Null
$certificate = Test-Path 'certs/local/cinema.local.crt'
$privateKey = Test-Path 'certs/local/cinema.local.key'
if ($certificate -xor $privateKey) { throw 'Par TLS incompleto em certs/local. Corrija-o sem sobrescrever arquivos existentes.' }
if (!$certificate) {
    $opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
    $opensslPath = if ($opensslCommand) { $opensslCommand.Source } else { 'C:/Program Files/Git/usr/bin/openssl.exe' }
    if (!(Test-Path $opensslPath)) { throw 'Instale OpenSSL ou gere o par com mkcert conforme docs/INFRAESTRUTURA_DOCKER.md.' }
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $opensslPath req -x509 -nodes -newkey rsa:2048 -keyout certs/local/cinema.local.key -out certs/local/cinema.local.crt -days 30 -subj '/CN=cinema.local' -addext 'subjectAltName=DNS:cinema.local,DNS:localhost,IP:127.0.0.1' 2>$null
    $certExitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    if ($certExitCode -ne 0) { throw 'OpenSSL falhou ao gerar o par TLS local.' }
}
Write-Output 'Ambiente isolado preparado; segredos e certificados locais ignorados pelo Git.'
