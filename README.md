# iPHL Homepage

CMS 없이 HTML/CSS/JS 로만 만든 정적(static) 연구실 홈페이지.

## 로컬에서 보기
`start-server.bat` 더블클릭 → 브라우저에서 http://localhost:8000
(html 파일을 직접 더블클릭하면 JSON 데이터가 안 읽힘)

## 온라인에 올리기: `publish.bat`
`update-site.bat` 과 같은 변환을 한 뒤 바뀐 파일을 GitHub 에 올림 → 1~2분 뒤 https://ziw215.github.io/iphl/ 에 반영.
(내 PC 에서만 확인할 때는 `update-site.bat`. 저장소를 연구실 계정으로 옮기면 `publish.bat` 의 주소 줄과 `git remote set-url origin 새주소`)

## 사진/뉴스 갱신: `update-site.bat`
아래 `-src` 폴더에 원본을 넣거나 지운 뒤 `update-site.bat` 실행 → 웹용 WebP 변환 + JSON 자동 생성.
```
people-src/백광준.jpg                         → 구성원 사진 (파일 이름 = members.json 의 한글 이름)
news-src/2026-11-20 학회 참가/요약.txt, 본문.txt, 01.jpg → 뉴스 (폴더 = 뉴스 1건, 첫 사진이 썸네일)
gallery-src/conference/2025-10 앨범 제목/*.jpg → 갤러리 (activity/ 도 동일)
home-src/hero.jpg                           → 홈 맨 위 배경 (홈 Research 칸은 research-src/fields 각 주제의 첫 이미지를 자동 사용)
research-src/fields/01 주제/설명.txt, 01.png  → Research Fields (facilities/ 도 동일, GIF 는 움직임 유지)
```
- `-src` 폴더는 원본 보관용이라 배포하지 않음 (`.gitignore`). **따로 백업할 것.**
- `data/news.json`, `data/gallery.json`, `assets/img/people·news·gallery/*.webp` 는 자동 생성물 → 직접 고치지 않음.

## 폴더 구조
```
index.html  ← Home (로고 클릭)
professor.html, researchers.html, alumni.html  ← Members 하위 페이지
projects.html, publications.html, presentations.html, patents.html  ← Achievement
research-fields.html, research-facilities.html  ← Research
conference.html, activity.html  ← Gallery
news.html
assets/css/style.css   ← 디자인 (색은 맨 위 :root 변수)
assets/js/main.js      ← 메뉴/푸터, 연구실 기본 정보, JSON 목록 렌더링
assets/img/            ← 이미지 (logo.png, school-logo.png(하단 학교 로고), people/·news/·gallery/ 는 자동 생성)
tools/                 ← update-site.bat 이 실행하는 변환 스크립트
data/members.json      ← 구성원
data/publications.json ← 논문
data/projects.json     ← 연구 과제
data/presentations.json ← 학회 발표
data/patents.json      ← 특허
data/news.json         ← 뉴스 (자동 생성)
data/gallery.json      ← 갤러리 (자동 생성)
```

## 자주 하는 수정
| 하고 싶은 것 | 고칠 파일 |
|---|---|
| 구성원 사진 | `people-src/한글이름.jpg` (예: `백광준.jpg`) → `update-site.bat` |
| 구성원 추가/졸업 | `data/members.json` (group 을 "Alumni"로) |
| 논문 추가 | `data/publications.json` |
| 학회 발표 추가 | `data/presentations.json` (type: "international" 또는 "domestic") |
| 특허 추가 | `data/patents.json` (number 에 특허번호 넣으면 함께 표시) |
| 과제 추가 | `data/projects.json` 맨 위에 추가 (진행/완료는 종료일로 자동 분류) |
| 뉴스 추가 | `news-src/_템플릿` 폴더를 복사해 `2026-11-20 제목` 으로 이름 변경 → `요약.txt`(목록), `본문.txt`(기사, `[사진1]` 로 사진 위치 지정), 사진 → `update-site.bat` |
| 뉴스 외부 기사 링크 | `본문.txt` 에 `원문 기사: https://...` 한 줄 → 기사에 "바로가기" 링크로 표시. 본문이 비어 있으면 요약이 대신 나옴 |
| News 한 페이지 글 수 | `assets/js/main.js` 의 `NEWS_PER_PAGE` (기본 10) |
| 메뉴 추가 | `assets/js/main.js` 의 `NAV` + 새 html 파일 |
| 갤러리 사진 추가 | `gallery-src/conference/` 또는 `activity/` 에 `2025-10 앨범 제목` 폴더 만들고 사진 넣기 → `update-site.bat` |
| 학회 발표 목록·인원 | 앨범 폴더에 `정보.txt` (Wix 형식: 장소 등 일반 줄 + `이름. "발표 제목"` 줄) → `update-site.bat`. 양식: `gallery-src/conference/_정보.txt 템플릿.txt` |
| 앨범 대표 사진 바꾸기 | 원하는 사진 파일 이름 앞에 `00_` 붙이고 `update-site.bat` |
| 하위 메뉴(드롭다운) 추가 | `NAV` 항목에 `children: [...]` 추가 (Members 참고) |
| 색/폰트 | `assets/css/style.css` 의 `:root` |
