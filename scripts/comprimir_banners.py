"""Comprime os banners do sistema para a versão pública.

Uso: comprimir_banners.py <origem> <destino> [lista.txt]

Lê cada PNG da lista (um nome por linha) em <origem>, reduz a largura máxima
para 1600 px e grava em <destino> com o mesmo nome, abaixo de 300 KB.
Sai com código 1 se algum arquivo passar do limite.
Requer Pillow: uv run --with pillow --no-project python scripts/comprimir_banners.py ...
"""
import sys
from pathlib import Path

from PIL import Image

LIMITE = 300_000
LARGURAS = (1600, 1280)


def salvar(img: Image.Image, destino: Path, largura: int) -> int:
    if img.width > largura:
        altura = round(img.height * largura / img.width)
        img = img.resize((largura, altura), Image.LANCZOS)
    img.save(destino, format="PNG", optimize=True)
    if destino.stat().st_size > LIMITE:
        # Reduz a paleta; preserva transparência quando existe canal alfa.
        metodo = Image.Quantize.FASTOCTREE if img.mode == "RGBA" else Image.Quantize.MEDIANCUT
        img.quantize(256, method=metodo).save(destino, format="PNG", optimize=True)
    return destino.stat().st_size


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    origem, destino = Path(sys.argv[1]), Path(sys.argv[2])
    destino.mkdir(parents=True, exist_ok=True)
    if len(sys.argv) > 3:
        nomes = [l.strip() for l in Path(sys.argv[3]).read_text(encoding="utf-8").splitlines() if l.strip()]
    else:
        nomes = sorted(p.name for p in origem.glob("banner-*.png"))

    maior, falhas = 0, 0
    for nome in nomes:
        src = origem / nome
        if not src.is_file():
            print(f"{nome}: ausente na origem")
            falhas += 1
            continue
        antes = src.stat().st_size
        img = Image.open(src)
        img.load()
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        out = destino / nome
        depois = 0
        for largura in LARGURAS:
            depois = salvar(img, out, largura)
            if depois <= LIMITE:
                break
        print(f"{nome}: {antes} -> {depois} bytes")
        maior = max(maior, depois)
        if depois > LIMITE:
            falhas += 1
    print(f"{len(nomes)} banners, maior: {maior} bytes")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
