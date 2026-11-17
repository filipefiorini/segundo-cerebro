<#
.SYNOPSIS
  Baixa o zip de uma release oficial do Segundo Cérebro e confere o SHA-256 dele.

.DESCRIPTION
  Etapa 1 do /atualizar, quando a pessoa aceita que o Code baixe a versão nova.
  A origem é fixa: as releases do repositório oficial ($Repo, abaixo). Não há parâmetro
  para trocar o endereço de rede.
  1. Sem -Versao, pergunta a última versão à API pública do GitHub (releases/latest). A
     API não devolve pre-release: enquanto só houver versão de teste publicada, a resposta
     é 404, e o script sai com 2 apontando o caminho manual.
  2. Baixa segundo-cerebro-v<versão>.zip.sha256 e lê o primeiro token (o hash; o formato
     é o do sha256sum, "<hash> *<nome>").
  3. Baixa segundo-cerebro-v<versão>.zip para <Destino>, com o nome final só depois de
     conferido. Recusa, apagando o arquivo baixado: o que não começa com os bytes "PK"
     (página de erro, JSON, arquivo vazio) e o que não bate com o hash.
  4. Imprime o caminho completo do zip conferido, numa linha, e sai com 0.

  Saídas: 0 ok; 2 recusa (versão sem release, versão mal formada, arquivo que não é zip,
  hash diferente); 1 falha de rede ou uso errado. As mensagens de recusa e de falha
  apontam o caminho manual (página de releases).

  -Origem existe só para os testes: aceita uma pasta local, nunca um endereço de rede.
  Nela o script lê segundo-cerebro-v<versão>.zip e segundo-cerebro-v<versão>.zip.sha256
  e, sem -Versao, o latest.json, que simula a resposta da API ({"tag_name": "v<versão>"});
  sem latest.json, é como a API responder 404.

  Windows PowerShell 5.1 (e PowerShell 7), TLS 1.2.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/baixar.ps1 -Destino .segundo-cerebro/preparo
#>
param(
  [string]$Destino,
  [string]$Versao,
  [string]$Origem
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Utf8SemBom = New-Object System.Text.UTF8Encoding $false
try { [Console]::OutputEncoding = $Utf8SemBom } catch { }

$Repo = 'filipefiorini/segundo-cerebro'
$PaginaReleases = "https://github.com/$Repo/releases"
$Manual = "Para seguir, baixe o zip pela página de releases do repositório oficial ($PaginaReleases) e me diga onde ele ficou."
$RegexVersao = '^\d+\.\d+\.\d+(-[0-9A-Za-z]+(\.[0-9A-Za-z]+)*)?\z'

function Sair([string]$mensagem, [int]$codigo) {
  [Console]::Error.WriteLine($mensagem)
  exit $codigo
}

$Http = $null

# HttpClient, e não Invoke-WebRequest: no Windows PowerShell 5.1, o 404 do GitHub chega
# ao Invoke-WebRequest como "conexão fechada", sem o código, e viraria falha de rede.
function Cliente-Http {
  if ($null -eq $script:Http) {
    Add-Type -AssemblyName System.Net.Http
    $script:Http = New-Object System.Net.Http.HttpClient
    $script:Http.Timeout = [TimeSpan]::FromMinutes(5)
    $script:Http.DefaultRequestHeaders.UserAgent.ParseAdd('segundo-cerebro-atualizar')
  }
  return $script:Http
}

# Grava em $alvo o arquivo $nome da origem (pasta local) ou de $url. $true: gravou;
# $false: não existe (404). Outra falha sai com 1.
function Obter([string]$url, [string]$nome, [string]$alvo) {
  if ($null -ne $Local) {
    $fonte = Join-Path $Local $nome
    if (-not (Test-Path -LiteralPath $fonte -PathType Leaf)) { return $false }
    try { Copy-Item -LiteralPath $fonte -Destination $alvo -Force } catch { Sair "Não consegui ler $fonte ($($_.Exception.Message))." 1 }
    return $true
  }
  $resposta = $null
  try {
    $resposta = (Cliente-Http).GetAsync($url).GetAwaiter().GetResult()
    if ([int]$resposta.StatusCode -eq 404) { return $false }
    if (-not $resposta.IsSuccessStatusCode) { throw "o servidor respondeu $([int]$resposta.StatusCode)" }
    $saida = [IO.File]::Create($alvo)
    try { $resposta.Content.CopyToAsync($saida).GetAwaiter().GetResult() } finally { $saida.Dispose() }
    return $true
  } catch {
    if (Test-Path -LiteralPath $alvo) { Remove-Item -LiteralPath $alvo -Force -ErrorAction SilentlyContinue }
    $motivo = $_.Exception.Message
    if ($null -ne $_.Exception.InnerException) { $motivo = $_.Exception.InnerException.Message }
    Sair "Não consegui baixar $url ($motivo). Confira a conexão e tente de novo. $Manual" 1
  } finally {
    if ($null -ne $resposta) { $resposta.Dispose() }
  }
}

# Conteúdo de texto do arquivo $nome, ou $null se não existe.
function Ler-Texto([string]$url, [string]$nome) {
  $temp = [IO.Path]::GetTempFileName()
  try {
    if (-not (Obter $url $nome $temp)) { return $null }
    return [IO.File]::ReadAllText($temp, $Utf8SemBom)
  } finally {
    Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
  }
}

function Comeca-Com-PK([string]$caminho) {
  $f = [IO.File]::OpenRead($caminho)
  try {
    $b = New-Object byte[] 2
    if ($f.Read($b, 0, 2) -lt 2) { return $false }
    return ($b[0] -eq 0x50 -and $b[1] -eq 0x4B)
  } finally { $f.Dispose() }
}

if ([string]::IsNullOrWhiteSpace($Destino)) { Sair 'Uso: baixar.ps1 -Destino <pasta> [-Versao <x.y.z>]' 1 }
$Local = $null
if (-not [string]::IsNullOrWhiteSpace($Origem)) {
  if (-not (Test-Path -LiteralPath $Origem -PathType Container)) { Sair "-Origem aceita só uma pasta local, usada nos testes: $Origem" 1 }
  $Local = (Resolve-Path -LiteralPath $Origem).ProviderPath
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. Versão
if ([string]::IsNullOrWhiteSpace($Versao)) {
  $texto = Ler-Texto "https://api.github.com/repos/$Repo/releases/latest" 'latest.json'
  if ($null -eq $texto) { Sair "O repositório oficial ainda não tem uma versão estável publicada (só versões de teste), então não sei qual baixar. $Manual" 2 }
  $tag = ''
  try { $tag = [string]($texto | ConvertFrom-Json).tag_name } catch { }
  if (-not $tag.StartsWith('v')) { Sair "A resposta do GitHub não trouxe a versão mais recente. $Manual" 2 }
  $Versao = $tag.Substring(1)
}
if ($Versao.StartsWith('v')) { $Versao = $Versao.Substring(1) }
if ($Versao -notmatch $RegexVersao) { Sair "Versão em formato que não reconheço: $Versao. $Manual" 2 }

$nome = "segundo-cerebro-v$Versao.zip"
$base = "https://github.com/$Repo/releases/download/v$Versao"
$pasta = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destino)
try { [void][IO.Directory]::CreateDirectory($pasta) } catch { Sair "Não consegui criar a pasta $pasta ($($_.Exception.Message))." 1 }
$final = Join-Path $pasta $nome
$parcial = "$final.parcial"
if (Test-Path -LiteralPath $parcial) { Remove-Item -LiteralPath $parcial -Force }

# 2. Hash publicado
$textoSha = Ler-Texto "$base/$nome.sha256" "$nome.sha256"
if ($null -eq $textoSha) { Sair "A versão $Versao não tem release no repositório oficial. $Manual" 2 }
$hashPublicado = (($textoSha.Trim() -split '\s+')[0])
if ($hashPublicado -notmatch '^[0-9A-Fa-f]{64}\z') { Sair "O arquivo de conferência da versão $Versao veio num formato que não reconheço. $Manual" 2 }

# 3. Zip, conferido antes de ganhar o nome final
if (-not (Obter "$base/$nome" $nome $parcial)) { Sair "A versão $Versao não tem o zip na release. $Manual" 2 }
if (-not (Comeca-Com-PK $parcial)) {
  Remove-Item -LiteralPath $parcial -Force
  Sair "O arquivo baixado não é um zip (pode ter vindo uma página de erro no lugar). Apaguei o arquivo. $Manual" 2
}
$hashBaixado = (Get-FileHash -LiteralPath $parcial -Algorithm SHA256).Hash
if (-not [string]::Equals($hashBaixado, $hashPublicado, [StringComparison]::OrdinalIgnoreCase)) {
  Remove-Item -LiteralPath $parcial -Force
  Sair "O zip baixado não confere com o hash publicado na release: veio corrompido ou incompleto. Apaguei o arquivo. $Manual" 2
}
Move-Item -LiteralPath $parcial -Destination $final -Force

# 4. Caminho do zip conferido
[Console]::Out.WriteLine($final)
exit 0
