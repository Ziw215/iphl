"""빌드 스크립트 공통 기능 (사진 변환, 이름 정리, 날짜 읽기, 남은 파일 정리)"""
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

DATE_RE = re.compile(r"^(\d{4})(?:[-.](\d{1,2}))?(?:[-.](\d{1,2}))?[\s_-]*(.*)$")


def safe_name(name: str) -> str:
    """URL/파일 이름에 문제 되는 문자 정리 (한글은 유지)"""
    name = re.sub(r"\s+", "-", name.strip())
    return re.sub(r'[\\/:*?"<>|#%&{}$!\'@+`=]', "", name)


def parse_date_title(folder_name: str):
    """'2025-10-15 제목' → (2025, '2025-10-15', '제목')"""
    m = DATE_RE.match(folder_name)
    if not m:
        return None, None, folder_name
    y, mo, d, title = m.groups()
    date = y + (f"-{int(mo):02d}" if mo else "") + (f"-{int(d):02d}" if d else "")
    return int(y), date, (title.strip() or folder_name)


def list_images(folder: Path):
    return sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXT)


def _resize(im, short_side=None, long_side=None, box=None):
    w, h = im.size
    if short_side:
        scale = short_side / min(w, h)
    elif long_side:
        scale = long_side / max(w, h)
    else:
        scale = min(box[0] / w, box[1] / h)
    if scale >= 1:
        return im.copy()
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def convert(src: Path, outputs, label=None):
    """
    src 사진을 WebP 로 변환. outputs = [(저장경로, {short_side|long_side|box: 값}, 품질), ...]
    이미 최신이면 건너뜀. 마지막 출력물의 (가로, 세로) 반환.
    """
    stale = lambda p: not p.exists() or p.stat().st_mtime < src.stat().st_mtime
    if any(stale(path) for path, _, _ in outputs):
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")   # 핸드폰 사진 회전 보정
            for path, size, quality in outputs:
                path.parent.mkdir(parents=True, exist_ok=True)
                _resize(im, **size).save(path, "WEBP", quality=quality, method=6)
        print(f"  변환: {label or src.name}")
    with Image.open(outputs[-1][0]) as f:
        return f.size


def clean_outputs(out_dir: Path, keep: set, exts=(".webp",)):
    """out_dir 안에서 이번 빌드에 쓰이지 않은 변환 파일(exts)과 빈 폴더 삭제 (원본에서 지운 사진 정리)"""
    if not out_dir.exists():
        return
    for f in out_dir.rglob("*"):
        if f.is_file() and f.suffix.lower() in exts and f not in keep:
            f.unlink()
            print(f"  삭제: {f.relative_to(ROOT)}")
    for d in sorted((p for p in out_dir.rglob("*") if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()
