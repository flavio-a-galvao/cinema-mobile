$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
# Cada chamada reserva um ambiente novo; preserva o projeto e volumes historicos.
$project = 'cinemax-rubrica-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$runDirectory = ".audit-tmp/infra/$project"
New-Item -ItemType Directory -Path "$runDirectory/certs" -ErrorAction Stop | Out-Null
$envFile = "$runDirectory/environment.env"
$content = (Get-Content .env.example -Raw).
    Replace('DB_ROOT_PASSWORD=change_me', 'DB_ROOT_PASSWORD=' + [guid]::NewGuid().ToString('N')).
    Replace('DB_PASS=change_me', 'DB_PASS=' + [guid]::NewGuid().ToString('N')).
    Replace('NODE_ENV=development', 'NODE_ENV=production').
    Replace('ENV_FILE=.env', "ENV_FILE=./$envFile").
    Replace('TLS_CERTS_DIR=./certs/local', "TLS_CERTS_DIR=./$runDirectory/certs").
    Replace('JWT_SECRET=change_me_use_a_long_random_secret', 'JWT_SECRET=' + [guid]::NewGuid().ToString('N'))
$content += "`nCINEMAX_INFRA_PROJECT=$project`nINFRA_NGINX_CONF=./$runDirectory/nginx.conf`n"
[IO.File]::WriteAllText((Join-Path (Get-Location) "$runDirectory/nginx.conf"), ((Get-Content nginx.conf -Raw).Replace('https://$server_name$request_uri', 'https://$server_name:18443$request_uri')), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path (Get-Location) $envFile), $content, [Text.UTF8Encoding]::new($false))
$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
$opensslPath = if ($opensslCommand) { $opensslCommand.Source } else { 'C:/Program Files/Git/usr/bin/openssl.exe' }
if (!(Test-Path $opensslPath)) { throw 'OpenSSL indisponivel; infraestrutura nao iniciada.' }
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $opensslPath req -x509 -nodes -newkey rsa:2048 -keyout "$runDirectory/certs/cinema.local.key" -out "$runDirectory/certs/cinema.local.crt" -days 30 -subj '/CN=cinema.local' -addext 'subjectAltName=DNS:cinema.local,DNS:localhost,IP:127.0.0.1' 2>$null | Out-Null
$certExitCode = $LASTEXITCODE
$ErrorActionPreference = $oldPreference
if ($certExitCode -ne 0) { throw 'OpenSSL falhou; infraestrutura nao iniciada.' }
$run = [ordered]@{ project=$project; envFile=$envFile; certificate="$runDirectory/certs/cinema.local.crt"; evidence="docs/evidencias/complementacao/infra-$project.json" }
$json = $run | ConvertTo-Json
[IO.File]::WriteAllText((Join-Path (Get-Location) "$runDirectory/run.json"), $json, [Text.UTF8Encoding]::new($false))
$json
