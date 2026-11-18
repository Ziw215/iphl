"""
구성원 사진
  people-src/한글이름.jpg          ← 원본 (예: 백광준.jpg)
        ↓
  assets/img/people/한글이름.webp  ← 웹용 (600x800 안에 맞춤)

같은 이름으로 확장자만 다른 파일이 여러 개면 (예: 김주호.jpg, 김주호.png) 가장 최근 파일을 사용.
"""
from common import ROOT, clean_outputs, convert, list_images

SRC = ROOT / "people-src"
OUT = ROOT / "assets" / "img" / "people"


def build():
    print("[구성원 사진]")
    SRC.mkdir(exist_ok=True)
    by_name = {}
    for src in list_images(SRC):
        prev = by_name.get(src.stem)
        if prev is None or src.stat().st_mtime > prev.stat().st_mtime:
            by_name[src.stem] = src
    keep = set()
    for name, src in sorted(by_name.items()):
        out = OUT / f"{name}.webp"
        try:
            convert(src, [(out, {"box": (600, 800)}, 82)])
        except Exception as e:
            print(f"  [건너뜀] {src.name}: {e}")
            continue
        keep.add(out)
    clean_outputs(OUT, keep)          # .webp 만 정리 (placeholder.svg 등은 그대로)
    print(f"  → 사진 {len(keep)}장")


if __name__ == "__main__":
    build()
