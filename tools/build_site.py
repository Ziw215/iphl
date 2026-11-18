"""update-site.bat 이 실행: 구성원 사진 / 뉴스 / 갤러리 / 연구 분야·시설 / 홈 이미지를 한 번에 갱신"""
import sys

import build_gallery
import build_home
import build_news
import build_people
import build_research

if __name__ == "__main__":
    sys.stdout.reconfigure(errors="replace")   # cmd 창에서 특수문자 파일명 출력 시 에러 방지
    build_people.build()
    build_news.build()
    build_gallery.build()
    build_research.build()
    build_home.build()
    print("\n완료. 브라우저에서 Ctrl + F5 를 누르세요.")
