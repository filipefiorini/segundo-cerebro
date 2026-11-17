<#
.SYNOPSIS
  Instala os seis plugins do núcleo do Segundo Cérebro em .obsidian/plugins/.

.DESCRIPTION
  Chamado pela etapa 1 do /instalar, com o Obsidian fechado. Para cada plugin do núcleo,
  baixa manifest.json, main.js e styles.css (se houver) da última versão publicada no
  repositório oficial do plugin no GitHub, confere o id do manifest.json e copia para
  .obsidian/plugins/<id>/. Plugin já instalado é pulado (a menos que -Atualizar).
  Grava o data.json de _docs/Configuração de Plugins/ só quando o plugin ainda não tem
  um, e garante os seis IDs em .obsidian/community-plugins.json.

  Rede: só api.github.com e os downloads das releases no github.com (que o GitHub
  redireciona para os servidores de arquivos dele, *.githubusercontent.com). Sem token,
  sem credencial, sem telemetria. Funciona no Windows PowerShell 5.1 e no PowerShell 7.

  Saída: uma linha por plugin. Código de saída 0 quando tudo deu certo, 1 quando algum
  plugin falhou, 2 quando recusou antes de começar (pasta errada ou Obsidian aberto).

.PARAMETER Vault
  Raiz do vault (a pasta com segundo-cerebro.manifest.json). Padrão: a pasta atual.

.PARAMETER Atualizar
  Baixa de novo os plugins já instalados. O data.json existente nunca é tocado.

.PARAMETER SemChecarObsidian
  Para teste do mantenedor numa cópia temporária do repositório: não confere se o
  Obsidian está aberto. Não usar num vault de verdade.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/instalar/plugins.ps1
#>
param(
  [string]$Vault = (Get-Location).Path,
  [switch]$Atualizar,
  [switch]$SemChecarObsidian
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch { }

# Mapa fixo: id do plugin -> nome no Obsidian, repositório oficial e configuração pronta.
$Nucleo = @(
  @{ Id = 'dataview';           Nome = 'Dataview';  Repo = 'blacksmithgu/obsidian-dataview'; Config = 'dataview.data.json' },
  @{ Id = 'templater-obsidian'; Nome = 'Templater'; Repo = 'silentvoid13/Templater';         Config = 'templater-obsidian.data.json' },
  @{ Id = 'tasknotes';          Nome = 'TaskNotes'; Repo = 'callumalpass/tasknotes';         Config = 'tasknotes.data.json' },
  @{ Id = 'homepage';           Nome = 'Homepage';  Repo = 'mirnovov/obsidian-homepage';     Config = 'homepage.data.json' },
  @{ Id = 'obsidian-banners';   Nome = 'Banners';   Repo = 'noatpad/obsidian-banners';       Config = $null },
  @{ Id = 'obsidian-git';       Nome = 'Git';       Repo = 'vinzent03/obsidian-git';         Config = 'obsidian-git.data.json' }
)
$Cabecalhos = @{ 'User-Agent' = 'segundo-cerebro-instalar'; 'Accept' = 'application/vnd.github+json' }
$Utf8SemBom = New-Object System.Text.UTF8Encoding $false

function Sair([string]$mensagem, [int]$codigo) {
  Write-Output $mensagem
  exit $codigo
}

# --- Conferências antes de começar ---------------------------------------------------
if (-not (Test-Path -LiteralPath $Vault -PathType Container)) {
  Sair "Recusado: a pasta '$Vault' não existe." 2
}
$Vault = (Resolve-Path -LiteralPath $Vault).Path
if (-not (Test-Path -LiteralPath (Join-Path $Vault 'segundo-cerebro.manifest.json'))) {
  Sair "Recusado: '$Vault' não é a raiz de um vault do Segundo Cérebro (falta segundo-cerebro.manifest.json)." 2
}
if (-not $SemChecarObsidian) {
  if (Get-Process -Name 'Obsidian' -ErrorAction SilentlyContinue) {
    Sair 'Recusado: o Obsidian está aberto. Feche o Obsidian (todas as janelas) e rode de novo.' 2
  }
}

$PastaPlugins = Join-Path $Vault '.obsidian\plugins'
$PastaConfig = Get-ChildItem -LiteralPath (Join-Path $Vault '_docs') -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq 'Configuração de Plugins' } | Select-Object -First 1
New-Item -ItemType Directory -Force -Path $PastaPlugins | Out-Null

function Ja-Instalado([string]$destino) {
  (Test-Path -LiteralPath (Join-Path $destino 'manifest.json')) -and
  (Test-Path -LiteralPath (Join-Path $destino 'main.js'))
}

function Eh-ErroDeRede($erro) {
  $e = $erro.Exception
  while ($e) {
    if ($e -is [System.Net.WebException] -and $e.Status -ne [System.Net.WebExceptionStatus]::ProtocolError) { return $true }
    if ($e.GetType().Name -eq 'HttpRequestException' -and -not $e.StatusCode) { return $true }
    if ($e -is [System.Net.Sockets.SocketException]) { return $true }
    $e = $e.InnerException
  }
  return $false
}

# 403 (limite da API) ou 404 (release sumida): o GitHub recusou agora.
function Eh-RecusaDoGitHub($erro) {
  $e = $erro.Exception
  while ($e) {
    $resp = $null
    try { $resp = $e.Response } catch { }
    if ($resp -and $resp.StatusCode) {
      $codigo = [int]$resp.StatusCode
      if ($codigo -eq 403 -or $codigo -eq 404) { return $true }
    }
    $e = $e.InnerException
  }
  return $false
}

# Baixa os arquivos da última release para uma pasta temporária e confere o id.
function Baixar-Plugin($p) {
  $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("sc-plugin-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $temp | Out-Null
  try {
    $release = Invoke-RestMethod -UseBasicParsing -Headers $Cabecalhos -Uri "https://api.github.com/repos/$($p.Repo)/releases/latest"
    foreach ($nome in @('manifest.json', 'main.js', 'styles.css')) {
      $asset = @($release.assets) | Where-Object { $_.name -eq $nome } | Select-Object -First 1
      if (-not $asset) {
        if ($nome -eq 'styles.css') { continue }
        throw "a versão $($release.tag_name) não traz $nome"
      }
      $url = [string]$asset.browser_download_url
      if (-not $url.StartsWith("https://github.com/$($p.Repo)/releases/download/", [StringComparison]::OrdinalIgnoreCase)) {
        throw "endereço de download inesperado para $nome"
      }
      Invoke-WebRequest -UseBasicParsing -Headers @{ 'User-Agent' = 'segundo-cerebro-instalar' } -Uri $url -OutFile (Join-Path $temp $nome)
    }
    $manifesto = [System.IO.File]::ReadAllText((Join-Path $temp 'manifest.json'), $Utf8SemBom) | ConvertFrom-Json
    if ($manifesto.id -ne $p.Id) {
      throw "o manifest.json baixado diz id '$($manifesto.id)', esperado '$($p.Id)'"
    }
    return $temp
  } catch {
    Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
    throw
  }
}

# --- Plugins ---------------------------------------------------------------------------
$linhas = @()
$falhas = 0
$semRede = 0
foreach ($p in $Nucleo) {
  $rotulo = "$($p.Nome) ($($p.Id))"
  $destino = Join-Path $PastaPlugins $p.Id
  $estado = $null
  $existia = Ja-Instalado $destino
  if ($existia -and -not $Atualizar) {
    $estado = 'já estava'
  } else {
    try {
      $temp = Baixar-Plugin $p
      try {
        New-Item -ItemType Directory -Force -Path $destino | Out-Null
        # Release nova sem styles.css: o antigo não fica na pasta.
        if (-not (Test-Path -LiteralPath (Join-Path $temp 'styles.css'))) {
          Remove-Item -LiteralPath (Join-Path $destino 'styles.css') -Force -ErrorAction SilentlyContinue
        }
        Get-ChildItem -LiteralPath $temp -File | ForEach-Object {
          Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $destino $_.Name) -Force
        }
      } finally {
        Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
      }
      if ($existia) { $estado = 'atualizado' } else { $estado = 'instalado' }
    } catch {
      $falhas++
      if (Eh-ErroDeRede $_) { $semRede++; $estado = 'erro: sem conexão com o GitHub' }
      elseif (Eh-RecusaDoGitHub $_) { $estado = 'erro: o GitHub recusou agora; tente em alguns minutos' }
      else { $estado = "erro: $($_.Exception.Message)" }
    }
  }

  # Configuração pronta: só quando o plugin está instalado e ainda não tem data.json.
  if ($p.Config -and -not $estado.StartsWith('erro')) {
    $dataJson = Join-Path $destino 'data.json'
    if (Test-Path -LiteralPath $dataJson) {
      $estado += '; configuração já existia'
    } elseif (-not $PastaConfig -or -not (Test-Path -LiteralPath (Join-Path $PastaConfig.FullName $p.Config))) {
      $falhas++
      $estado += "; erro: falta _docs/Configuração de Plugins/$($p.Config)"
    } else {
      Copy-Item -LiteralPath (Join-Path $PastaConfig.FullName $p.Config) -Destination $dataJson
      $estado += '; configuração gravada'
    }
  }
  $linhas += "${rotulo}: $estado"
}

# --- Lista de plugins ativos -----------------------------------------------------------
$arquivoLista = Join-Path $Vault '.obsidian\community-plugins.json'
$ids = @()
$listaOk = $true
if (Test-Path -LiteralPath $arquivoLista) {
  try {
    $texto = [System.IO.File]::ReadAllText($arquivoLista, $Utf8SemBom).Trim()
    if ($texto) {
      if (-not $texto.StartsWith('[')) { throw 'não é uma lista' }
      # Atribuir antes de percorrer: no PowerShell 5.1 o pipeline entrega a lista inteira de uma vez.
      $lido = ConvertFrom-Json -InputObject $texto
      $ids = @(foreach ($x in $lido) { [string]$x })
    }
  } catch {
    $listaOk = $false
  }
}
if ($listaOk) {
  $faltam = @($Nucleo | ForEach-Object { $_.Id } | Where-Object { $ids -notcontains $_ })
  if ($faltam.Count -gt 0 -or -not (Test-Path -LiteralPath $arquivoLista)) {
    $todos = @($ids) + $faltam
    $itens = $todos | ForEach-Object { '  ' + (ConvertTo-Json -InputObject ([string]$_) -Compress) }
    $json = "[`n" + ($itens -join ",`n") + "`n]"
    [System.IO.File]::WriteAllText($arquivoLista, $json, $Utf8SemBom)
    $linhas += "Lista de plugins ativos: acrescentados $($faltam.Count)"
  } else {
    $linhas += 'Lista de plugins ativos: já tinha os seis'
  }
} else {
  $falhas++
  $linhas += 'Lista de plugins ativos: erro: .obsidian/community-plugins.json não é um JSON válido; nada foi alterado'
}

$linhas | ForEach-Object { Write-Output $_ }
if ($semRede -gt 0) {
  Write-Output 'Sem conexão com o GitHub. Confira a internet e tente de novo; se continuar, siga o caminho manual de _docs/Configuração de Plugins/LEIA-ME.md.'
}
if ($falhas -gt 0) { exit 1 }
exit 0
