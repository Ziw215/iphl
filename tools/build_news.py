"""
뉴스
  news-src/<YYYY-MM-DD 제목>/
      요약.txt    ← News 목록에 보이는 짧은 소개 (2~3줄)
      본문.txt    ← 클릭했을 때 보이는 기사 본문
      01.jpg ...  ← 사진 (이름순. 첫 장이 목록 썸네일)
        ↓
  assets/img/news/<뉴스>/thumb/*.webp, full/*.webp
  data/news.json

- 본문 중간에 [사진1], [사진2] 처럼 한 줄로 쓰면 그 자리에 해당 사진이 들어감
  (번호 = 사진 파일 이름순). 본문에 안 넣은 사진은 기사 맨 아래에 표시.
- 요약은 News 목록에서만 보이고 기사에는 나오지 않음. 요약.txt 가 없으면 목록에 본문 앞부분이 표시됨.
- 제목에 폴더 이름으로 못 쓰는 문자(: ? / 등)가 필요하면
  요약.txt 또는 본문.txt 첫 줄에  제목: 실제 제목  을 쓰면 그게 제목이 됨.
- 이름이 _ 로 시작하는 폴더(예: _템플릿)는 무시.
"""
import json

from common import ROOT, clean_outputs, convert, list_images, parse_date_title, rel, safe_name

SRC = ROOT / "news-src"
OUT = ROOT / "assets" / "img" / "news"
JSON_PATH = ROOT / "data" / "news.json"
SUMMARY_FILE = "요약.txt"
BODY_FILE = "본문.txt"


def read_text(path):
    if not path.exists():
        return ""
    for enc in ("utf-8-sig", "cp949"):          # 메모장 UTF-8 / 옛 ANSI 둘 다 지원
        try:
            text = path.read_text(encoding=enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = path.read_text(encoding="utf-8", errors="replace")
    # 웹페이지(Wix 등)에서 복사할 때 딸려오는 보이지 않는 문자 제거 → 빈 문단 방지
    for ch in ("​", "‌", "‍", "﻿", " "):
        text = text.replace(ch, " " if ch == " " else "")
    return "\n".join(line.rstrip() for line in text.splitlines()).strip()


def pop_title(text):
    """첫 줄이 '제목:' 이면 (제목, 나머지) 반환"""
    if text.startswith("제목:"):
        first, _, rest = text.partition("\n")
        return first[3:].strip(), rest.strip()
    return None, text


def build():
    print("[뉴스]")
    SRC.mkdir(exist_ok=True)
    news, keep = [], set()
    for d in sorted(p for p in SRC.iterdir() if p.is_dir() and not p.name.startswith("_")):
        _, date, title = parse_date_title(d.name)
        if not date:
            print(f"  [건너뜀] 폴더 이름이 날짜로 시작하지 않음: {d.name}")
            continue
        news_id = safe_name(d.name)

        t1, summary = pop_title(read_text(d / SUMMARY_FILE))
        t2, body = pop_title(read_text(d / BODY_FILE))
        title = t1 or t2 or title
        others = [p.name for p in d.glob("*.txt") if p.name not in (SUMMARY_FILE, BODY_FILE)]
        if others:
            print(f"  [참고] {d.name}: {', '.join(others)} 는 사용되지 않음 ({SUMMARY_FILE}, {BODY_FILE} 만 읽음)")

        images = []
        for src in list_images(d):
            stem = safe_name(src.stem)
            thumb = OUT / news_id / "thumb" / f"{stem}.webp"
            full = OUT / news_id / "full" / f"{stem}.webp"
            try:
                convert(src, [(thumb, {"short_side": 400}, 75), (full, {"long_side": 1600}, 82)],
                        label=f"{d.name}/{src.name}")
            except Exception as e:
                print(f"  [건너뜀] {src.name}: {e}")
                continue
            keep.update({thumb, full})
            images.append({"thumb": rel(thumb), "full": rel(full)})

        news.append({"id": news_id, "date": date, "title": title,
                     "summary": summary, "body": body, "images": images})

    news.sort(key=lambda n: n["date"], reverse=True)
    clean_outputs(OUT, keep)
    JSON_PATH.write_text(json.dumps(news, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → 뉴스 {len(news)}건")


if __name__ == "__main__":
    build()
