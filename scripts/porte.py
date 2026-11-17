"""Registro de porte: o que do framework do vault privado já foi levado ao público.

O registro vive no vault privado (um JSON). Cada par guarda o SHA-256 do
arquivo privado no momento do porte; se o arquivo muda depois, vira pendência.
"""
from __future__ import annotations

import fnmatch
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import release

RAIZES_PRIVADAS = ("CLAUDE.md", "BEM-VINDO.md", "Homepage.md", "_docs/", "_templates/", "_skills/")
VERSAO_SCHEMA = 1
ESTADOS = ("portado", "so-privado")
_PREFIXO_SKILLS = "_skills/"
_DESTINO_SKILLS = ".claude/skills/"
_TEMPORARIOS = ("~$*", "*.tmp", "*.bak*", "Thumbs.db")
_CHAVES_DO_PAR = ("privado", "estado", "publico", "sha256")


@dataclass(frozen=True)
class Pendencia:
    privado: str
    publico: str | None
    motivo: str  # "novo" ou "mudou"


def par_publico(rel_privado: str) -> str:
    """Caminho público do arquivo privado: `_skills/<x>/...` vira `.claude/skills/<x>/...`."""
    if rel_privado.startswith(_PREFIXO_SKILLS):
        return _DESTINO_SKILLS + rel_privado[len(_PREFIXO_SKILLS):]
    return rel_privado


def _e_temporario(nome: str) -> bool:
    return any(fnmatch.fnmatchcase(nome, padrao) for padrao in _TEMPORARIOS)


def framework_privado(privado: Path) -> list[str]:
    """Arquivos do vault privado sob as raízes do framework, ordenados, com `/`."""
    privado = Path(privado)
    achados: set[str] = set()
    for raiz in RAIZES_PRIVADAS:
        alvo = privado / raiz.rstrip("/")
        if alvo.is_file():
            achados.add(raiz.rstrip("/"))
        elif alvo.is_dir():
            for arquivo in alvo.rglob("*"):
                if arquivo.is_file() and not _e_temporario(arquivo.name):
                    achados.add(arquivo.relative_to(privado).as_posix())
    return sorted(achados)


def carregar_registro(caminho: Path) -> dict:
    """Lê o registro; arquivo ausente vale registro vazio; par sem chave levanta ValueError."""
    caminho = Path(caminho)
    if not caminho.is_file():
        return {"versao_schema": VERSAO_SCHEMA, "pares": []}
    registro = json.loads(caminho.read_text(encoding="utf-8"))
    for par in registro.get("pares", []):
        for chave in _CHAVES_DO_PAR:
            if not isinstance(par, dict) or chave not in par:
                raise ValueError(f"registro de porte: par sem '{chave}'")
    return registro


def salvar_registro(caminho: Path, registro: dict) -> None:
    """Grava JSON indentado, UTF-8 sem BOM, LF, pares ordenados por `privado`."""
    caminho = Path(caminho)
    saida = dict(registro)
    saida["pares"] = sorted(registro["pares"], key=lambda p: p["privado"])
    texto = json.dumps(saida, ensure_ascii=False, indent=2) + "\n"
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "w", encoding="utf-8", newline="\n") as f:
        f.write(texto)


def sha256_porte(caminho: Path) -> str:
    """SHA-256 do arquivo com fim de linha normalizado (CRLF -> LF), só para o registro de porte."""
    dados = Path(caminho).read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(dados).hexdigest()


def pendencias(privado: Path, registro: dict) -> list[Pendencia]:
    """Arquivos novos (sem par) e portados que mudaram desde o porte."""
    privado = Path(privado)
    pares = {p["privado"]: p for p in registro["pares"]}
    resultado: list[Pendencia] = []
    for rel in framework_privado(privado):
        par = pares.get(rel)
        if par is None:
            resultado.append(Pendencia(rel, None, "novo"))
        elif par["estado"] == "portado" and sha256_porte(privado / rel) != par["sha256"]:
            resultado.append(Pendencia(rel, par["publico"], "mudou"))
    return resultado


def marcar(
    privado: Path,
    registro: dict,
    rel: str,
    estado: str,
    publico: str | None = None,
    nota: str = "",
) -> dict:
    """Registra (ou atualiza) o par de `rel` com o hash atual; devolve o registro."""
    if estado not in ESTADOS:
        raise ValueError(f"estado inválido: {estado!r}")
    if estado == "portado" and publico is None:
        publico = par_publico(rel)
    if estado == "so-privado":
        publico = None
    par = {
        "privado": rel,
        "publico": publico,
        "estado": estado,
        "sha256": sha256_porte(Path(privado) / rel),
        "nota": nota,
    }
    pares = [p for p in registro["pares"] if p["privado"] != rel]
    pares.append(par)
    return {**registro, "pares": sorted(pares, key=lambda p: p["privado"])}
