<#
.SYNOPSIS
  Aplica o plano.json do /atualizar com backup, ou grava a base da instalação.

.DESCRIPTION
  Modo aplicar (etapa 7 do /atualizar):
  1. Recusa, antes de gravar, caminho com "..", letra de unidade ou que resolva fora da raiz.
  2. Recusa, antes de gravar, alvo que a release nova não autoriza: copiar.de fora de
     .segundo-cerebro/preparo/; copiar.para que não seja arquivo listado na release,
     .segundo-cerebro/base/<fixo listado>, .segundo-cerebro-version ou
     segundo-cerebro.release.json; remover e renomear fora de removidos e renomeados do
     historico da release (ou da cópia deles em .segundo-cerebro/base/); remover ou
     renomear arquivo que a release nova lista.
  3. Cria .segundo-cerebro/backup/<yyyyMMdd-HHmmss>-v<de>-para-v<para>/, guarda em
     arquivos/<rel> todo alvo que existe e grava backup.json.
  4. Renomeia, copia e remove, criando as pastas. Se o .gitignore existe e não ignora
     .segundo-cerebro/backup/ e .segundo-cerebro/preparo/, acrescenta as linhas no fim
     (com backup, como os outros alvos).
  5. Se algo falhar, restaura deste backup e sai com 1 (a pasta do backup fica, com falha.txt).
  6. Apaga os backups mais antigos além de -ManterBackups e sai com 0.
  Recusa antes de gravar sai com 2.

  Modo -GravarBase (etapa 9 do /instalar): copia cada arquivo fixo do
  segundo-cerebro.release.json da raiz para .segundo-cerebro/base/<rel>. Recusa se a base
  já tem arquivo. Sem backup.

  Funciona no Windows PowerShell 5.1 e no PowerShell 7.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/aplicar.ps1 -Raiz . -Plano .segundo-cerebro/preparo/v1.1.0/plano.json -Release .segundo-cerebro/preparo/v1.1.0/origem/segundo-cerebro.release.json

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/aplicar.ps1 -Raiz . -GravarBase
#>
param(
  [string]$Raiz = (Get-Location).Path,
  [string]$Plano,
  [string]$Release,
  [int]$ManterBackups = 2,
  [switch]$GravarBase
)

$ErrorActionPreference = 'Stop'
$Utf8SemBom = New-Object System.Text.UTF8Encoding $false
try { [Console]::OutputEncoding = $Utf8SemBom } catch { }
$PrefixoBase = '.segundo-cerebro/base/'
$PrefixoPreparo = '.segundo-cerebro/preparo/'

function Sair([string]$mensagem, [int]$codigo) {
  [Console]::Error.WriteLine($mensagem)
  exit $codigo
}

function Rel-Valido([string]$rel) {
  if ([string]::IsNullOrWhiteSpace($rel)) { return $false }
  if ($rel.Contains(':')) { return $false }
  if ($rel.StartsWith('/') -or $rel.StartsWith('\')) { return $false }
  foreach ($parte in ($rel -split '[\\/]')) { if ($parte -eq '..') { return $false } }
  return $true
}

# Caminho completo de <rel> dentro de <base>; $null se o caminho é inválido ou sai de <base>.
function Caminho-Cheio([string]$base, [string]$rel) {
  if (-not (Rel-Valido $rel)) { return $null }
  $comBarra = $base.TrimEnd('\') + '\'
  try { $cheio = [IO.Path]::GetFullPath([IO.Path]::Combine($comBarra, $rel.Replace('/', '\'))) } catch { return $null }
  if (-not $cheio.StartsWith($comBarra, [StringComparison]::OrdinalIgnoreCase)) { return $null }
  return $cheio
}

function Ler-Json([string]$caminho) {
  return (Get-Content -LiteralPath $caminho -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Gravar-Json([string]$caminho, $objeto) {
  [IO.File]::WriteAllText($caminho, (ConvertTo-Json -InputObject $objeto -Depth 10), $Utf8SemBom)
}

function Copiar-Arquivo([string]$de, [string]$para) {
  [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($para))
  [IO.File]::Copy($de, $para, $true)
}

function Conjunto {
  # A vírgula impede o PowerShell de desenrolar o conjunto (vazio viraria $null).
  return , (New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase))
}

function Normalizar([string]$rel) { return $rel.Replace('\', '/') }

function Sem-Prefixo-Base([string]$rel) {
  if ($rel.StartsWith($PrefixoBase, [StringComparison]::OrdinalIgnoreCase)) { return $rel.Substring($PrefixoBase.Length) }
  return $null
}

if (-not (Test-Path -LiteralPath $Raiz -PathType Container)) { Sair "Pasta da instância não encontrada: $Raiz" 2 }
$RaizCheia = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Raiz).ProviderPath)
$DirBase = Join-Path $RaizCheia '.segundo-cerebro\base'

# ---------------------------------------------------------------- modo -GravarBase
if ($GravarBase) {
  $arqRelease = Join-Path $RaizCheia 'segundo-cerebro.release.json'
  if (-not (Test-Path -LiteralPath $arqRelease -PathType Leaf)) { Sair 'Não achei o segundo-cerebro.release.json na raiz.' 2 }
  if ([IO.Directory]::Exists($DirBase) -and [IO.Directory]::GetFiles($DirBase, '*', [IO.SearchOption]::AllDirectories).Length -gt 0) {
    Sair 'A pasta .segundo-cerebro/base/ já existe com arquivos. Nada foi gravado.' 2
  }
  $releaseRaiz = Ler-Json $arqRelease
  $copias = New-Object System.Collections.ArrayList
  $erros = New-Object System.Collections.Generic.List[string]
  $ausentes = New-Object System.Collections.Generic.List[string]
  foreach ($a in @($releaseRaiz.arquivos)) {
    if ([string]$a.tipo -ne 'fixo') { continue }
    $caminho = [string]$a.caminho
    $origem = Caminho-Cheio $RaizCheia $caminho
    $destino = Caminho-Cheio $DirBase $caminho
    if ($null -eq $origem -or $null -eq $destino) { $erros.Add("caminho inválido: $caminho"); continue }
    if (-not [IO.File]::Exists($origem)) { $ausentes.Add($caminho); continue }
    [void]$copias.Add(@($origem, $destino))
  }
  if ($erros.Count -gt 0) {
    foreach ($e in $erros) { Write-Output "  $e" }
    Sair 'A base não foi gravada.' 2
  }
  $baseExistia = [IO.Directory]::Exists($DirBase)
  $copiados = New-Object System.Collections.Generic.List[string]
  try {
    foreach ($c in $copias) { Copiar-Arquivo $c[0] $c[1]; $copiados.Add($c[1]) }
  } catch {
    # Desfaz a base parcial, para que uma nova chamada não seja recusada.
    $falha = $_.Exception.Message
    try {
      if ($baseExistia) { foreach ($f in $copiados) { [IO.File]::Delete($f) } }
      elseif ([IO.Directory]::Exists($DirBase)) { Remove-Item -LiteralPath $DirBase -Recurse -Force }
    } catch { }
    Sair "Falha ao gravar a base ($falha). Nada ficou em .segundo-cerebro/base/." 1
  }
  Write-Output "Base gravada: $($copias.Count) arquivos fixo em .segundo-cerebro/base/."
  foreach ($f in $ausentes) { Write-Output "  ausente: $f" }
  exit 0
}

# ---------------------------------------------------------------- modo aplicar
if ([string]::IsNullOrWhiteSpace($Plano) -or [string]::IsNullOrWhiteSpace($Release)) {
  Sair 'Uso: aplicar.ps1 -Raiz <pasta> -Plano <plano.json> -Release <segundo-cerebro.release.json> [-ManterBackups 2] | -GravarBase' 2
}
if ($ManterBackups -lt 1) { Sair '-ManterBackups precisa ser 1 ou mais.' 2 }
$ArqPlano = Caminho-Cheio $RaizCheia $Plano
$ArqRelease = Caminho-Cheio $RaizCheia $Release
if ($null -eq $ArqPlano -or $null -eq $ArqRelease) { Sair 'Caminho de -Plano ou -Release inválido: use um caminho relativo dentro da instância.' 2 }
if (-not [IO.File]::Exists($ArqPlano)) { Sair "Plano não encontrado: $Plano" 2 }
if (-not [IO.File]::Exists($ArqRelease)) { Sair "Release não encontrada: $Release" 2 }
try { $PlanoLido = Ler-Json $ArqPlano; $ReleaseNova = Ler-Json $ArqRelease } catch { Sair 'O plano.json ou o segundo-cerebro.release.json não é um JSON válido.' 2 }

$VersaoDe = [string]$PlanoLido.de
$VersaoPara = [string]$PlanoLido.para
foreach ($v in @($VersaoDe, $VersaoPara)) {
  if ($v -notmatch '^[0-9A-Za-z.-]+$' -or $v.Contains('..')) { Sair "Versão inválida no plano: '$v'." 2 }
}

# O que a release autoriza
$Listados = Conjunto
$Fixos = Conjunto
$HashesRelease = @{}
foreach ($a in @($ReleaseNova.arquivos)) {
  [void]$Listados.Add([string]$a.caminho)
  $HashesRelease[([string]$a.caminho).ToLowerInvariant()] = ([string]$a.sha256).ToLowerInvariant()
  if ([string]$a.tipo -eq 'fixo') { [void]$Fixos.Add([string]$a.caminho) }
}
$RemovidosRel = Conjunto
$RenomeadosRel = Conjunto
foreach ($h in @($ReleaseNova.historico)) {
  foreach ($x in @($h.removidos)) { if ($null -ne $x) { [void]$RemovidosRel.Add([string]$x) } }
  foreach ($x in @($h.renomeados)) { if ($null -ne $x) { [void]$RenomeadosRel.Add([string]$x.de + "`n" + [string]$x.para) } }
}

function Para-Autorizado([string]$rel) {
  if ($Listados.Contains($rel)) { return $true }
  if ($rel -eq '.segundo-cerebro-version' -or $rel -eq 'segundo-cerebro.release.json') { return $true }
  $semBase = Sem-Prefixo-Base $rel
  return ($null -ne $semBase -and $Fixos.Contains($semBase))
}

# Código de módulo (Guarda, Painel) que não é .md só entra vindo da release.
function Eh-Codigo-De-Modulo([string]$rel) {
  if ($rel.EndsWith('.md', [StringComparison]::OrdinalIgnoreCase)) { return $false }
  return ($rel.StartsWith('.claude/skills/guarda-constituicao/', [StringComparison]::OrdinalIgnoreCase) -or
          $rel.StartsWith('.claude/skills/painel-tarefas/', [StringComparison]::OrdinalIgnoreCase))
}

function Hash-Arquivo([string]$caminho) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($caminho))) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

function Remover-Autorizado([string]$rel) {
  if ($RemovidosRel.Contains($rel)) { return $true }
  $semBase = Sem-Prefixo-Base $rel
  return ($null -ne $semBase -and $RemovidosRel.Contains($semBase))
}

function Renomear-Autorizado([string]$de, [string]$para) {
  if ($RenomeadosRel.Contains($de + "`n" + $para)) { return $true }
  $deSem = Sem-Prefixo-Base $de
  $paraSem = Sem-Prefixo-Base $para
  return ($null -ne $deSem -and $null -ne $paraSem -and $RenomeadosRel.Contains($deSem + "`n" + $paraSem))
}

# Removido ou renomeado numa versão e de volta na release nova: fica.
function Esta-Na-Release([string]$rel) {
  if ($Listados.Contains($rel)) { return $true }
  $semBase = Sem-Prefixo-Base $rel
  return ($null -ne $semBase -and $Listados.Contains($semBase))
}

# Conteúdo novo do .gitignore com as linhas do preparo e do backup que faltam; $null se
# não há .gitignore ou nada falta. Mantém BOM e fim de linha do arquivo.
function Gitignore-Novo([string]$caminho) {
  if (-not [IO.File]::Exists($caminho)) { return $null }
  $bytes = [IO.File]::ReadAllBytes($caminho)
  $bom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $texto = $Utf8SemBom.GetString($bytes).TrimStart([char]0xFEFF)
  $presentes = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
  foreach ($l in ($texto -split '\r?\n')) { [void]$presentes.Add($l.Trim().TrimStart('/').TrimEnd('/')) }
  $faltam = @(@('.segundo-cerebro/backup/', '.segundo-cerebro/preparo/') | Where-Object { -not $presentes.Contains($_.TrimEnd('/')) })
  if ($faltam.Count -eq 0) { return $null }
  if ($texto.Contains("`r`n")) { $fim = "`r`n" } else { $fim = "`n" }
  if ($texto.Length -gt 0 -and -not $texto.EndsWith("`n")) { $texto += $fim }
  foreach ($f in $faltam) { $texto += $f + $fim }
  $novo = $Utf8SemBom.GetBytes($texto)
  if ($bom) { $novo = [byte[]](@(0xEF, 0xBB, 0xBF) + $novo) }
  return @{ Bytes = $novo; Linhas = $faltam }
}

# 1 e 2. Validação inteira antes de gravar qualquer coisa
$Erros = New-Object System.Collections.Generic.List[string]
$Copias = New-Object System.Collections.ArrayList
$Remocoes = New-Object System.Collections.ArrayList
$Renomes = New-Object System.Collections.ArrayList
$Alvos = New-Object System.Collections.ArrayList
$AlvosVistos = Conjunto

function Validar-Caminho([string]$rel, [string]$papel) {
  $cheio = Caminho-Cheio $RaizCheia $rel
  if ($null -eq $cheio) { $Erros.Add("$papel fora da raiz ou inválido: '$rel'") }
  return $cheio
}

function Anotar-Alvo([string]$rel, [string]$cheio) {
  if ($AlvosVistos.Add($rel)) { [void]$Alvos.Add(@($rel, $cheio)) }
}

foreach ($r in @($PlanoLido.renomear)) {
  if ($null -eq $r) { continue }
  $de = Normalizar ([string]$r.de); $para = Normalizar ([string]$r.para)
  $deCheio = Validar-Caminho $de 'renomear.de'
  $paraCheio = Validar-Caminho $para 'renomear.para'
  if ($null -eq $deCheio -or $null -eq $paraCheio) { continue }
  if (-not (Renomear-Autorizado $de $para)) { $Erros.Add("renomear '$de' -> '$para' não consta dos renomeados da release"); continue }
  if (Esta-Na-Release $de) { $Erros.Add("renomear '$de': o arquivo está na release nova"); continue }
  [void]$Renomes.Add(@($deCheio, $paraCheio))
  Anotar-Alvo $de $deCheio
  Anotar-Alvo $para $paraCheio
}
foreach ($c in @($PlanoLido.copiar)) {
  if ($null -eq $c) { continue }
  $de = Normalizar ([string]$c.de); $para = Normalizar ([string]$c.para)
  $deCheio = Validar-Caminho $de 'copiar.de'
  $paraCheio = Validar-Caminho $para 'copiar.para'
  if ($null -eq $deCheio -or $null -eq $paraCheio) { continue }
  if (-not $de.StartsWith($PrefixoPreparo, [StringComparison]::OrdinalIgnoreCase)) { $Erros.Add("copiar.de fora de .segundo-cerebro/preparo/: '$de'"); continue }
  if (-not (Para-Autorizado $para)) { $Erros.Add("copiar.para não autorizado pela release: '$para'"); continue }
  if (Eh-Codigo-De-Modulo $para) {
    if ($de -cne ($PrefixoPreparo + 'v' + $VersaoPara + '/origem/' + $para)) { $Erros.Add("código de módulo precisa vir de origem/ da release: '$para'"); continue }
    $esperado = $HashesRelease[$para.ToLowerInvariant()]
    if (-not [IO.File]::Exists($deCheio) -or [string]::IsNullOrEmpty($esperado) -or (Hash-Arquivo $deCheio) -ne $esperado) { $Erros.Add("código de módulo com hash diferente do da release: '$para'"); continue }
  }
  [void]$Copias.Add(@($deCheio, $paraCheio))
  Anotar-Alvo $para $paraCheio
}
foreach ($x in @($PlanoLido.remover)) {
  if ($null -eq $x) { continue }
  $rel = Normalizar ([string]$x)
  $cheio = Validar-Caminho $rel 'remover'
  if ($null -eq $cheio) { continue }
  if (-not (Remover-Autorizado $rel)) { $Erros.Add("remover '$rel' não consta dos removidos da release"); continue }
  if (Esta-Na-Release $rel) { $Erros.Add("remover '$rel': o arquivo está na release nova"); continue }
  [void]$Remocoes.Add($cheio)
  Anotar-Alvo $rel $cheio
}

if ($Erros.Count -gt 0) {
  Write-Output 'Plano recusado; nada foi gravado:'
  foreach ($e in $Erros) { Write-Output "  $e" }
  Sair 'O plano.json tem caminho fora da raiz ou alvo que a release não autoriza.' 2
}

$ArqGitignore = Join-Path $RaizCheia '.gitignore'
$GitignoreNovo = Gitignore-Novo $ArqGitignore
if ($null -ne $GitignoreNovo) { Anotar-Alvo '.gitignore' $ArqGitignore }

# 3. Backup
$DirBackups = Join-Path $RaizCheia '.segundo-cerebro\backup'
$NomeBase = '{0}-v{1}-para-v{2}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $VersaoDe, $VersaoPara
$Nome = $NomeBase
$n = 2
while ([IO.Directory]::Exists((Join-Path $DirBackups $Nome))) { $Nome = "$NomeBase-$n"; $n++ }
$DirBackup = Join-Path $DirBackups $Nome
$DirBackupArquivos = Join-Path $DirBackup 'arquivos'

$Registro = New-Object System.Collections.ArrayList
try {
  [void][IO.Directory]::CreateDirectory($DirBackupArquivos)
  foreach ($alvo in $Alvos) {
    $existia = [IO.File]::Exists($alvo[1])
    if ($existia) { Copiar-Arquivo $alvo[1] (Caminho-Cheio $DirBackupArquivos $alvo[0]) }
    [void]$Registro.Add([ordered]@{ caminho = $alvo[0]; existia = $existia })
  }
  $Info = [ordered]@{
    de       = $VersaoDe
    para     = $VersaoPara
    criado   = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss.fffzzz', [Globalization.CultureInfo]::InvariantCulture)
    arquivos = $Registro.ToArray()
  }
  Gravar-Json (Join-Path $DirBackup 'backup.json') $Info
} catch {
  Sair "Falha ao criar o backup; nada foi alterado na instância: $($_.Exception.Message)" 1
}

# 4. Renomeia, copia, remove
try {
  foreach ($r in $Renomes) {
    if (-not [IO.File]::Exists($r[0])) { continue }
    [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($r[1]))
    if ([IO.File]::Exists($r[1])) { [IO.File]::Delete($r[1]) }
    [IO.File]::Move($r[0], $r[1])
  }
  foreach ($c in $Copias) { Copiar-Arquivo $c[0] $c[1] }
  foreach ($x in $Remocoes) { if ([IO.File]::Exists($x)) { [IO.File]::Delete($x) } }
  if ($null -ne $GitignoreNovo) { [IO.File]::WriteAllBytes($ArqGitignore, $GitignoreNovo.Bytes) }
} catch {
  # 5. Restaura do backup
  $falha = $_.Exception.Message
  $naoRestaurados = New-Object System.Collections.Generic.List[string]
  for ($i = $Alvos.Count - 1; $i -ge 0; $i--) {
    $rel = $Alvos[$i][0]; $cheio = $Alvos[$i][1]
    try {
      if ($Registro[$i].existia) { Copiar-Arquivo (Caminho-Cheio $DirBackupArquivos $rel) $cheio }
      elseif ([IO.File]::Exists($cheio)) { [IO.File]::Delete($cheio) }
    } catch { $naoRestaurados.Add($rel) }
  }
  $log = "Falha ao aplicar: $falha`r`n"
  if ($naoRestaurados.Count -gt 0) { $log += "Não restaurados: " + ($naoRestaurados -join ', ') + "`r`n" }
  try { [IO.File]::WriteAllText((Join-Path $DirBackup 'falha.txt'), $log, $Utf8SemBom) } catch { }
  if ($naoRestaurados.Count -gt 0) {
    Sair "Falha ao aplicar ($falha). A restauração não conseguiu voltar: $($naoRestaurados -join ', '). Backup em .segundo-cerebro/backup/$Nome." 1
  }
  Sair "Falha ao aplicar ($falha). A instância voltou ao que era; o backup ficou em .segundo-cerebro/backup/$Nome." 1
}

# 6. Rotação dos backups
try {
  $lista = New-Object System.Collections.ArrayList
  foreach ($pasta in [IO.Directory]::GetDirectories($DirBackups)) {
    $arq = Join-Path $pasta 'backup.json'
    if (-not [IO.File]::Exists($arq)) { continue }
    # Backup de aplicação que falhou não entra na rotação nem conta entre os mantidos.
    if ([IO.File]::Exists((Join-Path $pasta 'falha.txt'))) { continue }
    try {
      $criado = [DateTimeOffset]::Parse([string](Ler-Json $arq).criado, [Globalization.CultureInfo]::InvariantCulture)
      [void]$lista.Add([pscustomobject]@{ Pasta = $pasta; Criado = $criado; Nome = [IO.Path]::GetFileName($pasta) })
    } catch { continue }
  }
  $antigos = @($lista | Sort-Object -Property @{ Expression = 'Criado'; Descending = $true }, @{ Expression = 'Nome'; Descending = $true } | Select-Object -Skip $ManterBackups)
  foreach ($a in $antigos) { Remove-Item -LiteralPath $a.Pasta -Recurse -Force }
} catch {
  Write-Output "Aviso: não consegui apagar backups antigos: $($_.Exception.Message)"
}

Write-Output "Atualização aplicada: $($Renomes.Count) renomeados, $($Copias.Count) copiados, $($Remocoes.Count) removidos."
if ($null -ne $GitignoreNovo) { Write-Output "Linhas acrescentadas ao .gitignore: $($GitignoreNovo.Linhas -join ', ')." }
Write-Output "Backup em .segundo-cerebro/backup/$Nome."
exit 0
