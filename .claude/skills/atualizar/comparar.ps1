<#
.SYNOPSIS
  Compara a instância com a versão nova e grava o comparacao.json do /atualizar.

.DESCRIPTION
  Etapa 1 do /atualizar. Só lê; a única gravação é o arquivo indicado em -Saida.
  1. Lê <Origem>/segundo-cerebro.release.json e confere o sha256 de cada arquivo listado
     dentro de <Origem>. Arquivo ausente ou com hash diferente: imprime os caminhos, não
     grava nada e sai com 2.
  2. Lê a versão instalada em .segundo-cerebro-version. Versões que não se comparam (dois
     sufixos diferentes sobre os mesmos números, ou formato inválido): sai com 3.
  3. Classifica cada arquivo listado comparando a instância, .segundo-cerebro/base/ e a
     origem. Em arquivo com blocos <!-- usuario:inicio --> / <!-- usuario:fim -->, o
     conteúdo de cada bloco é trocado por vazio nos três lados antes do hash (marcador só
     vale na linha inteira e fora de cerca de código). Instância igual à nova: nada.
  4. Grava o comparacao.json (UTF-8 sem BOM) e sai com 0.

  Funciona no Windows PowerShell 5.1 e no PowerShell 7.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/comparar.ps1 -Raiz . -Origem .segundo-cerebro/preparo/v1.1.0/origem -Saida .segundo-cerebro/preparo/v1.1.0/comparacao.json
#>
param(
  [string]$Raiz = (Get-Location).Path,
  [string]$Origem,
  [string]$Saida
)

$ErrorActionPreference = 'Stop'
$Utf8SemBom = New-Object System.Text.UTF8Encoding $false
try { [Console]::OutputEncoding = $Utf8SemBom } catch { }
$MarcaInicio = '<!-- usuario:inicio -->'
$MarcaFim = '<!-- usuario:fim -->'

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

function Hash-Bytes([byte[]]$bytes) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return (-join ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') })) }
  finally { $sha.Dispose() }
}

# Esvazia os blocos usuario: do texto e conta os pares. Marcador só vale quando ocupa a
# linha inteira (espaço em volta e CR final permitidos) e está fora de cerca de código
# (``` ou ~~~); marcador citado em linha ou dentro de cerca é texto comum. Bloco sem
# fechamento até o fim do arquivo não conta e fica como está. Fins de linha intactos.
function Esvaziar-Blocos([string]$texto) {
  $linhas = [regex]::Split($texto, '(?<=\n)')
  $saida = New-Object System.Text.StringBuilder
  $pendente = New-Object System.Text.StringBuilder
  $cerca = $null
  $dentro = $false
  $pares = 0
  $primeira = $true
  foreach ($linha in $linhas) {
    $limpa = $linha
    if ($primeira) { $limpa = $limpa.TrimStart([char]0xFEFF); $primeira = $false }
    # Cerca de código Markdown: até três espaços de recuo (tab vale quatro).
    $recuo = 0
    foreach ($c in $limpa.ToCharArray()) {
      if ($c -eq ' ') { $recuo++ } elseif ($c -eq "`t") { $recuo += 4 } else { break }
    }
    $limpa = $limpa.Trim()
    if ($dentro) {
      if ($limpa -ceq $MarcaFim) {
        [void]$saida.Append($linha)
        $dentro = $false
        $pares++
      } else {
        [void]$pendente.Append($linha)
      }
      continue
    }
    if ($null -ne $cerca) {
      if ($recuo -le 3 -and $limpa.StartsWith($cerca, [StringComparison]::Ordinal)) { $cerca = $null }
    } elseif ($recuo -le 3 -and $limpa.StartsWith('```', [StringComparison]::Ordinal)) {
      $cerca = '```'
    } elseif ($recuo -le 3 -and $limpa.StartsWith('~~~', [StringComparison]::Ordinal)) {
      $cerca = '~~~'
    } elseif ($limpa -ceq $MarcaInicio) {
      $dentro = $true
      [void]$pendente.Clear()
    }
    [void]$saida.Append($linha)
  }
  if ($dentro) { [void]$saida.Append($pendente.ToString()) }
  return @{ Texto = $saida.ToString(); Pares = $pares }
}

# Hash para a classificação (blocos usuario: esvaziados) e número de blocos; $null se ausente.
function Ler-Lado([string]$caminho) {
  if ([string]::IsNullOrEmpty($caminho) -or -not [IO.File]::Exists($caminho)) { return $null }
  $bytes = [IO.File]::ReadAllBytes($caminho)
  $texto = $Utf8SemBom.GetString($bytes)
  $blocos = 0
  $hash = $null
  if ($texto.Contains($MarcaInicio)) {
    $r = Esvaziar-Blocos $texto
    $blocos = $r.Pares
    if ($blocos -gt 0) { $hash = Hash-Bytes ($Utf8SemBom.GetBytes($r.Texto)) }
  }
  if ($null -eq $hash) { $hash = Hash-Bytes $bytes }
  return @{ Hash = $hash; Blocos = $blocos }
}

function Ler-Versao([string]$v) {
  if ($null -eq $v) { return $null }
  $m = [regex]::Match($v.Trim(), '^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$')
  if (-not $m.Success) { return $null }
  $sufixo = ''
  if ($m.Groups[4].Success) { $sufixo = $m.Groups[4].Value }
  return @{ N = @([long]$m.Groups[1].Value, [long]$m.Groups[2].Value, [long]$m.Groups[3].Value); Sufixo = $sufixo }
}

# -1, 0 ou 1; $null quando não se comparam.
function Comparar-Versao([string]$a, [string]$b) {
  $va = Ler-Versao $a
  $vb = Ler-Versao $b
  if ($null -eq $va -or $null -eq $vb) { return $null }
  for ($i = 0; $i -lt 3; $i++) {
    if ($va.N[$i] -lt $vb.N[$i]) { return -1 }
    if ($va.N[$i] -gt $vb.N[$i]) { return 1 }
  }
  if ($va.Sufixo -ceq $vb.Sufixo) { return 0 }
  if ($va.Sufixo -eq '') { return 1 }
  if ($vb.Sufixo -eq '') { return -1 }
  return $null
}

function E-Modulo([string]$rel) {
  $prefixos = @('.claude/skills/guarda-constituicao/', '.claude/skills/painel-tarefas/')
  foreach ($p in $prefixos) {
    if ($rel.StartsWith($p, [StringComparison]::Ordinal) -and -not $rel.EndsWith('.md', [StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

if ([string]::IsNullOrWhiteSpace($Origem) -or [string]::IsNullOrWhiteSpace($Saida)) {
  Sair 'Uso: comparar.ps1 -Raiz <pasta> -Origem <pasta da release extraída> -Saida <comparacao.json>' 1
}
if (-not (Test-Path -LiteralPath $Raiz -PathType Container)) { Sair "Pasta da instância não encontrada: $Raiz" 1 }
$RaizCheia = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Raiz).ProviderPath)
$DirOrigem = Caminho-Cheio $RaizCheia $Origem
$ArqSaida = Caminho-Cheio $RaizCheia $Saida
if ($null -eq $DirOrigem -or $null -eq $ArqSaida) { Sair 'Caminho de -Origem ou -Saida inválido: use um caminho relativo dentro da instância.' 1 }

# 1. Release e hashes
$ArqRelease = Join-Path $DirOrigem 'segundo-cerebro.release.json'
if (-not (Test-Path -LiteralPath $ArqRelease -PathType Leaf)) { Sair "Não achei o segundo-cerebro.release.json em $Origem." 2 }
try { $Release = Get-Content -LiteralPath $ArqRelease -Raw -Encoding UTF8 | ConvertFrom-Json }
catch { Sair 'O segundo-cerebro.release.json da origem não é um JSON válido.' 2 }
$Arquivos = @($Release.arquivos)

$Errados = New-Object System.Collections.Generic.List[string]
foreach ($a in $Arquivos) {
  $caminho = Caminho-Cheio $DirOrigem ([string]$a.caminho)
  if ($null -eq $caminho -or -not [IO.File]::Exists($caminho)) { $Errados.Add([string]$a.caminho); continue }
  $hash = Hash-Bytes ([IO.File]::ReadAllBytes($caminho))
  if ($hash -ne ([string]$a.sha256).ToLowerInvariant()) { $Errados.Add([string]$a.caminho) }
}
if ($Errados.Count -gt 0) {
  Write-Output 'Arquivos ausentes ou com hash diferente do listado no segundo-cerebro.release.json:'
  foreach ($e in $Errados) { Write-Output "  $e" }
  Sair 'A release não confere. Nada foi preparado; baixe o zip de novo da página de releases oficial.' 2
}

# 2. Versões
$ArqVersao = Join-Path $RaizCheia '.segundo-cerebro-version'
if (-not (Test-Path -LiteralPath $ArqVersao -PathType Leaf)) { Sair 'Não achei o .segundo-cerebro-version na raiz da instância.' 3 }
$De = (Get-Content -LiteralPath $ArqVersao -Raw -Encoding UTF8).Trim()
$Para = [string]$Release.versao
if ($null -eq (Comparar-Versao $De $Para)) { Sair "As versões $De (instalada) e $Para (nova) não se comparam." 3 }

$Removidos = New-Object System.Collections.ArrayList
$Renomeados = New-Object System.Collections.ArrayList
$Migracoes = New-Object System.Collections.ArrayList
foreach ($h in @($Release.historico)) {
  $acimaDaInstalada = Comparar-Versao ([string]$h.versao) $De
  $ateNova = Comparar-Versao ([string]$h.versao) $Para
  if ($null -eq $acimaDaInstalada -or $null -eq $ateNova) { Sair "A versão $($h.versao) do histórico não se compara com $De ou $Para." 3 }
  if ($acimaDaInstalada -gt 0 -and $ateNova -le 0) {
    foreach ($x in @($h.removidos)) { if ($null -ne $x) { [void]$Removidos.Add($x) } }
    foreach ($x in @($h.renomeados)) { if ($null -ne $x) { [void]$Renomeados.Add($x) } }
    foreach ($x in @($h.migracoes)) { if ($null -ne $x) { [void]$Migracoes.Add($x) } }
  }
}

# 3. Classificação
$DirBase = Join-Path $RaizCheia '.segundo-cerebro\base'
$TemBase = [IO.Directory]::Exists($DirBase) -and ([IO.Directory]::GetFiles($DirBase, '*', [IO.SearchOption]::AllDirectories).Length -gt 0)

$Itens = New-Object System.Collections.ArrayList
foreach ($a in $Arquivos) {
  $rel = [string]$a.caminho
  $tipo = [string]$a.tipo
  $inst = Ler-Lado (Caminho-Cheio $RaizCheia $rel)
  $nova = Ler-Lado (Caminho-Cheio $DirOrigem $rel)

  if ($tipo -eq 'semente') {
    if ($null -ne $inst) { $acao = 'ignorar' } else { $acao = 'criar' }
  } elseif ($tipo -ne 'fixo') {
    $acao = 'ignorar'
  } elseif ($null -ne $inst -and $inst.Hash -eq $nova.Hash) {
    # Instância já igual à nova: nada a fazer, com ou sem base.
    $acao = 'nada'
  } elseif (-not $TemBase) {
    $acao = 'perguntar'
  } else {
    $base = Ler-Lado (Caminho-Cheio $RaizCheia ('.segundo-cerebro/base/' + $rel))
    if ($null -eq $inst) {
      if ($null -ne $base) { $acao = 'perguntar-apagado' } else { $acao = 'copiar' }
    } elseif ($null -eq $base) {
      # Arquivo presente na instância que não está na base (e diferente da nova).
      $acao = 'perguntar'
    } elseif ($inst.Hash -eq $base.Hash) {
      if ($nova.Hash -eq $base.Hash) { $acao = 'nada' } else { $acao = 'substituir' }
    } elseif ($nova.Hash -eq $base.Hash) {
      $acao = 'manter'
    } elseif (E-Modulo $rel) {
      $acao = 'modulo'
    } else {
      $acao = 'mesclar'
    }
  }

  $blocosInst = 0
  if ($null -ne $inst) { $blocosInst = $inst.Blocos }
  [void]$Itens.Add([ordered]@{
    caminho = $rel
    tipo    = $tipo
    acao    = $acao
    blocos  = [ordered]@{ instancia = $blocosInst; nova = $nova.Blocos }
  })
}

# 4. Saída
$Resultado = [ordered]@{
  de         = $De
  para       = $Para
  tem_base   = [bool]$TemBase
  arquivos   = $Itens.ToArray()
  removidos  = $Removidos.ToArray()
  renomeados = $Renomeados.ToArray()
  migracoes  = $Migracoes.ToArray()
}
$Json = ConvertTo-Json -InputObject $Resultado -Depth 10
[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($ArqSaida))
[IO.File]::WriteAllText($ArqSaida, $Json, $Utf8SemBom)
Write-Output "Comparação gravada em $Saida ($($Itens.Count) arquivos, de $De para $Para)."
exit 0
