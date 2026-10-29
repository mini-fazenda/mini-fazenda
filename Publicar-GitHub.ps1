$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
$destination = Join-Path (Split-Path $source -Parent) 'mini-fazenda-repositorio'
if (Test-Path $destination) { throw "A pasta $destination já existe. Escolha outra pasta ou use seu clone existente manualmente." }
git clone https://github.com/mini-fazenda/mini-fazenda.git $destination
if ($LASTEXITCODE -ne 0) { throw 'Falha ao clonar. Confira o Git e sua autenticação no GitHub.' }
Get-ChildItem -LiteralPath $source -Force | Where-Object { $_.Name -ne '.git' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
}
Push-Location $destination
try {
    git add .
    git commit -m 'Adiciona Mini Fazenda com login Google, saves Firebase e visitas'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar commit. Configure seu nome e email no Git.' }
    git push -u origin HEAD:main
    if ($LASTEXITCODE -ne 0) { throw 'O GitHub recusou o envio. Confira sua autenticação e as permissões do repositório.' }
    Write-Host 'Código enviado. Configure o Firebase e publique o Hosting conforme README.md.'
} finally { Pop-Location }
