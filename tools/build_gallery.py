"""
갤러리
  gallery-src/<분류>/<YYYY-MM 앨범 제목>/*.jpg   ← 원본
        ↓
  assets/img/gallery/<분류>/<앨범>/thumb/*.webp  ← 목록용 (짧은 변 400px)
  assets/img/gallery/<분류>/<앨범>/full/*.webp   ← 확대용 (긴 변 1600px)
  data/gallery.json
앨범 대표 사진 = 파일 이름순 첫 번째 (바꾸려면 원하는 사진 이름 앞에 00_)

앨범 폴더에 정보.txt 를 넣으면 발표 목록·인원이 앨범 위에 표시됨 (Wix 와 같은 형식)
  Houston, USA                                         ← 일반 줄 = 그대로 표시 (장소, 메모 등)
  고지완. "Development of a TVC Noise Prediction ..."   ← 이름. "발표 제목" → 발표 목록, 인원 자동 계산
  "두 번째 발표 제목"                                   ← 이름 없이 "제목" → 바로 위 사람의 다른 발표
  수상: 박준성 Best Paper Award                         ← "항목: 내용" 도 가능 (제목: 을 쓰면 앨범 제목 변경)
"""
import json
import re

from build_news import read_text
from common import ROOT, clean_outputs, convert, list_images, parse_date_title, rel, safe_name

SRC = ROOT / "gallery-src"
OUT = ROOT / "assets" / "img" / "gallery"
JSON_PATH = ROOT / "data" / "gallery.json"
CATEGORIES = ["conference", "activity"]          # Gallery 하위 메뉴
KEY_RE = re.compile(r"^([^\s:：\"“][^:：\"“]{0,11}?)\s*[:：]\s*(.*)$")       # "항목: 내용"
TALK_RE = re.compile(r'^(?:([^\s"“.,][^"“.,]{0,19}?)\s*\.?\s*)?(["“].*)$')    # 이름. "제목"


def read_info(path):
    """정보.txt → [{"label": 항목, "value": 내용} 또는 {"label": "발표", "items": [...], "count": 인원}]"""
    title, fields, talks, names = None, [], None, []
    for line in read_text(path).splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if not line:
            continue
        t, k = TALK_RE.match(line), KEY_RE.match(line)
        if t:
            if talks is None:
                talks = {"label": "발표", "items": []}
                fields.append(talks)
            name = (t.group(1) or "").strip()
            talks["items"].append({"name": name, "title": t.group(2)})
            if name and name not in names:
                names.append(name)
        elif k and k.group(1).strip() == "제목":
            title = k.group(2).strip() or None
        elif k:
            fields.append({"label": k.group(1).strip(), "value": k.group(2).strip()})
        else:
            fields.append({"label": "", "value": line})
    if talks and names:
        talks["count"] = len(names)
    return title, fields


def build():
    print("[갤러리]")
    data, keep = {}, set()
    for cat in CATEGORIES:
        (SRC / cat).mkdir(parents=True, exist_ok=True)
        albums = []
        for album_dir in sorted(p for p in (SRC / cat).iterdir() if p.is_dir()):
            year, date, title = parse_date_title(album_dir.name)
            album_id = safe_name(album_dir.name)
            photos = []
            for src in list_images(album_dir):
                stem = safe_name(src.stem)
                thumb = OUT / cat / album_id / "thumb" / f"{stem}.webp"
                full = OUT / cat / album_id / "full" / f"{stem}.webp"
                try:
                    w, h = convert(src, [(thumb, {"short_side": 400}, 75), (full, {"long_side": 1600}, 82)],
                                   label=f"{cat}/{album_dir.name}/{src.name}")
                except Exception as e:
                    print(f"  [건너뜀] {src.name}: {e}")
                    continue
                keep.update({thumb, full})
                photos.append({"thumb": rel(thumb), "full": rel(full), "w": w, "h": h})
            t, info = read_info(album_dir / "정보.txt")      # 없으면 빈 목록
            title = t or title
            if photos or info:                                   # 사진 없이 정보.txt 만 있어도 표시
                albums.append({"id": album_id, "title": title, "date": date, "year": year,
                               "cover": photos[0]["thumb"] if photos else None, "info": info, "photos": photos})
        albums.sort(key=lambda a: a["date"] or "", reverse=True)   # 최신 앨범이 위
        data[cat] = albums
    clean_outputs(OUT, keep)
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    n_alb = sum(len(c) for c in data.values())
    n_img = sum(len(a["photos"]) for c in data.values() for a in c)
    print(f"  → 앨범 {n_alb}개, 사진 {n_img}장")


if __name__ == "__main__":
    build()
