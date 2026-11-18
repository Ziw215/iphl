"""
홈 화면 이미지
  home-src/hero.jpg      ← 맨 위 큰 배경 이미지
        ↓
  assets/img/home/<이름>.webp  (긴 변 1920px)
"""
from common import ROOT, clean_outputs, convert, list_images

SRC = ROOT / "home-src"
OUT = ROOT / "assets" / "img" / "home"


def build():
    print("[홈 이미지]")
    SRC.mkdir(exist_ok=True)
    keep = set()
    for src in list_images(SRC):
        out = OUT / f"{src.stem}.webp"
        try:
            convert(src, [(out, {"long_side": 1920}, 80)])
        except Exception as e:
            print(f"  [건너뜀] {src.name}: {e}")
            continue
        keep.add(out)
    clean_outputs(OUT, keep)
    print(f"  → 이미지 {len(keep)}장 ({', '.join(sorted(p.stem for p in keep)) or '없음'})")


if __name__ == "__main__":
    build()
