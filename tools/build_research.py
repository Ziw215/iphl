"""
Research Fields / Research Facilities
  research-src/fields/<01 주제 이름>/       ← 폴더 = 주제 1개 (앞 번호 = 화면 순서, 화면에는 안 보임)
      설명.txt                              ← 주제 설명 (없어도 됨. 한 줄 = 한 문단)
      01.png, 02.jpg, 03.gif ...            ← 이미지 (이름순으로 표시)
  research-src/facilities/<01 시설 이름>/   ← 위와 동일
        ↓
  assets/img/research/<분류>/<주제>/*.webp  (긴 변 1600px)
  GIF, 동영상(mp4, webm) 은 변환하지 않고 그대로 복사 (화면에서 자동 반복 재생)
  data/research.json

- 제목에 폴더 이름으로 못 쓰는 문자(: ? / 등)가 필요하면 설명.txt 첫 줄에  제목: 실제 제목
- 이름이 _ 로 시작하는 폴더는 무시
"""
import json
import re
import shutil

from build_news import pop_title, read_text
from common import ROOT, clean_outputs, convert, rel, safe_name

SRC = ROOT / "research-src"
OUT = ROOT / "assets" / "img" / "research"
JSON_PATH = ROOT / "data" / "research.json"
CATEGORIES = ["fields", "facilities"]
COPY_EXT = {".gif", ".mp4", ".webm"}                                    # 그대로 복사
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"} | COPY_EXT


def build():
    print("[연구 분야/시설]")
    data, keep = {}, set()
    for cat in CATEGORIES:
        (SRC / cat).mkdir(parents=True, exist_ok=True)
        topics = []
        for d in sorted(p for p in (SRC / cat).iterdir() if p.is_dir() and not p.name.startswith("_")):
            title = re.sub(r"^\d+[\s._-]+", "", d.name).strip() or d.name      # 앞 번호 제거
            topic_id = safe_name(title)
            t, text = pop_title(read_text(d / "설명.txt"))
            title = t or title

            images = []
            for src in sorted(p for p in d.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXT):
                out_dir = OUT / cat / topic_id
                stem = safe_name(src.stem)
                try:
                    if src.suffix.lower() in COPY_EXT:                       # GIF·동영상은 그대로
                        out = out_dir / f"{stem}{src.suffix.lower()}"
                        if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
                            out_dir.mkdir(parents=True, exist_ok=True)
                            shutil.copy2(src, out)
                            print(f"  복사: {cat}/{d.name}/{src.name}")
                    else:
                        out = out_dir / f"{stem}.webp"
                        convert(src, [(out, {"long_side": 1600}, 85)], label=f"{cat}/{d.name}/{src.name}")
                except Exception as e:
                    print(f"  [건너뜀] {src.name}: {e}")
                    continue
                keep.add(out)
                images.append(rel(out))

            topics.append({"id": topic_id, "title": title, "text": text, "images": images})
        data[cat] = topics

    clean_outputs(OUT, keep, exts=(".webp", *COPY_EXT))
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → 연구 분야 {len(data['fields'])}개, 시설 {len(data['facilities'])}개, "
          f"이미지 {sum(len(t['images']) for c in data.values() for t in c)}장")


if __name__ == "__main__":
    build()
