<#
.SYNOPSIS
  Desfaz uma atualização a partir de um backup do /atualizar.

.DESCRIPTION
  Modo desfazer do /atualizar. Lê <Backup>/backup.json e, para cada arquivo (ou só o
  indicado em -Arquivo): existia antes da atualização -> copia de volta de
  <Backup>/arquivos/<rel>; não existia -> remove. Sai com 0 quando tudo voltou, 1 quando
  algum arquivo falhou, 2 quando recusou antes de começar.

  Funciona no Windows PowerShell 5.1 e no PowerShell 7.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/desfazer.ps1 -Raiz . -Backup .segundo-cerebro/backup/<data-hora>-v1.0.0-para-v1.1.0

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/atualizar/desfazer.ps1 -Raiz . -Backup .segundo-cerebro/backup/<data-hora>-v1.0.0-para-v1.1.0 -Arquivo CLAUDE.md
#>
param(
  [string]$Raiz = (Get-Location).Path,
  [string]$Backup,
  [string]$Arquivo
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }

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

if ([string]::IsNullOrWhiteSpace($Backup)) { Sair 'Uso: desfazer.ps1 -Raiz <pasta> -Backup <pasta do backup> [-Arquivo <rel>]' 2 }
if (-not (Test-Path -LiteralPath $Raiz -PathType Container)) { Sair "Pasta da instância não encontrada: $Raiz" 2 }
$RaizCheia = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Raiz).ProviderPath)
$DirBackup = Caminho-Cheio $RaizCheia $Backup
if ($null -eq $DirBackup) { Sair 'Caminho de -Backup inválido: use um caminho relativo dentro da instância.' 2 }
$ArqInfo = Join-Path $DirBackup 'backup.json'
if (-not (Test-Path -LiteralPath $ArqInfo -PathType Leaf)) { Sair "Não achei o backup.json em $Backup." 2 }
$DirArquivos = Join-Path $DirBackup 'arquivos'
$Info = Get-Content -LiteralPath $ArqInfo -Raw -Encoding UTF8 | ConvertFrom-Json

$Itens = @($Info.arquivos | Where-Object { $null -ne $_ })
if (-not [string]::IsNullOrWhiteSpace($Arquivo)) {
  $alvo = $Arquivo.Replace('\', '/')
  $Itens = @($Itens | Where-Object { [string]::Equals([string]$_.caminho, $alvo, [StringComparison]::OrdinalIgnoreCase) })
  if ($Itens.Count -eq 0) { Sair "O arquivo '$Arquivo' não está neste backup." 2 }
}

# Valida todos os caminhos antes de mexer em qualquer arquivo.
$Passos = New-Object System.Collections.ArrayList
foreach ($item in $Itens) {
  $rel = [string]$item.caminho
  $destino = Caminho-Cheio $RaizCheia $rel
  $origem = Caminho-Cheio $DirArquivos $rel
  if ($null -eq $destino -or $null -eq $origem) { Sair "Caminho inválido no backup.json: '$rel'. Nada foi alterado." 2 }
  [void]$Passos.Add(@($rel, $destino, $origem, [bool]$item.existia))
}

$Falhas = New-Object System.Collections.Generic.List[string]
foreach ($p in $Passos) {
  $rel = $p[0]; $destino = $p[1]; $origem = $p[2]; $existia = $p[3]
  try {
    if ($existia) {
      [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destino))
      [IO.File]::Copy($origem, $destino, $true)
      Write-Output "Restaurado: $rel"
    } elseif ([IO.File]::Exists($destino)) {
      [IO.File]::Delete($destino)
      Write-Output "Removido: $rel"
    }
  } catch {
    $Falhas.Add("$rel ($($_.Exception.Message))")
  }
}

if ($Falhas.Count -gt 0) { Sair ("Não consegui desfazer: " + ($Falhas -join '; ')) 1 }
Write-Output "Desfeito a partir de $Backup."
exit 0
