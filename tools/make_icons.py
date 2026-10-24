# Gera os ícones do Prumo (um prumo de pedreiro branco sobre o azul do app).
# Uso: python tools/make_icons.py   (precisa do Pillow)
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
BLUE = (47, 69, 201, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # desenha em 4x e reduz, para bordas suaves


def draw(size, rounded, scale=1.0):
    S = 512 * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=112 * SS, fill=BLUE)
    else:
        d.rectangle([0, 0, S, S], fill=BLUE)

    def p(x, y):  # coordenadas no quadro de 512, com escala em torno do centro
        return ((256 + (x - 256) * scale) * SS, (256 + (y - 256) * scale) * SS)

    def r(v):
        return v * scale * SS

    # fio
    x0, y0 = p(249, 84)
    x1, y1 = p(263, 236)
    d.rounded_rectangle([x0, y0, x1, y1], radius=r(7), fill=WHITE)
    # tampa do peso
    x0, y0 = p(222, 222)
    x1, y1 = p(290, 256)
    d.rounded_rectangle([x0, y0, x1, y1], radius=r(8), fill=WHITE)
    # peso: ombro reto e ponta afiada embaixo
    d.polygon([p(196, 268), p(316, 268), p(330, 300), p(256, 448), p(182, 300)], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    draw(192, True).save(OUT / "icon-192.png")
    draw(512, True).save(OUT / "icon-512.png")
    draw(512, False, 0.78).save(OUT / "icon-maskable-512.png")
    draw(180, False, 0.86).save(OUT / "apple-touch-icon.png")
    draw(64, True).save(OUT / "favicon.png")
    draw(256, True).save(OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    draw(32, True).save(OUT / "tray.png")


if __name__ == "__main__":
    main()
