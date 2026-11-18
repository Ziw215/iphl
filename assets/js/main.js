// =====================================================================
// 공통 스크립트: 모든 페이지에서 불러옴
//  1) 헤더(메뉴) / 푸터를 한 곳에서 관리
//  2) data/*.json 을 읽어서 목록(구성원, 논문, 뉴스)을 그려줌
// =====================================================================

// ---- 사이트 기본 정보 (여기만 고치면 전 페이지에 반영) ----
const SITE = {
  name: "iPHL",
  logo: "assets/img/logo.png",          // 상단 로고 이미지 (파일이 없으면 name 글자로 표시)
  schoolLogo: "assets/img/school-logo.png", // 하단 연구실 정보 왼쪽 학교 로고 (파일이 없으면 자리 없이 표시)
  schoolLink: "https://www.inha.ac.kr",     // 학교 로고 클릭 시 이동 ("" 이면 링크 없음)
  showMemberNo: true,                   // 구성원 이름 앞에 연구실 번호 표시 (members.json 의 "no")
  fullName: "Propulsion Hydrodynamics Laboratory",          // TODO: 연구실 정식 명칭
  affiliation: "Department of Naval Architecture & Ocean Engineering, Inha University", // TODO
  address: "4호관 132B 선박해양추진연구실",    // TODO
  Tel: "032-860-7331",
};

// ---- 메뉴 (순서 = 화면 순서) ----
// children 을 넣으면 마우스를 올렸을 때 아래로 하위 메뉴 패널이 펼쳐짐
// Home 은 왼쪽 로고(iPHL) 클릭으로 이동
const NAV = [
  { href: "professor.html", label: "Members", children: [
      { href: "professor.html",   label: "Professor" },
      { href: "researchers.html", label: "Researcher" },
      { href: "alumni.html",      label: "Alumni" },
  ]},
  { href: "projects.html", label: "Achievement", children: [
      { href: "projects.html",      label: "Project" },
      { href: "publications.html",  label: "Publication" },
      { href: "presentations.html", label: "Presentation" },
      { href: "patents.html",       label: "Patents" },
  ]},
  { href: "research-fields.html", label: "Research", children: [
      { href: "research-fields.html",     label: "Research Fields" },
      { href: "research-facilities.html", label: "Research Facilities" },
  ]},
  { href: "conference.html", label: "Gallery", children: [
      { href: "conference.html", label: "Conference" },
      { href: "activity.html",   label: "Activity" },
  ]},
  { href: "news.html", label: "News" },
];

function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  const current = location.pathname.split("/").pop() || "index.html";
  const cls = active => active ? ' class="active"' : "";

  const items = NAV.map(n => {
    const active = n.href === current || (n.children || []).some(c => c.href === current);
    if (!n.children) {
      return `<div class="nav-item"><a href="${n.href}"${cls(active)}>${n.label}</a></div>`;
    }
    const sub = n.children.map(c =>
      `<a href="${c.href}"${cls(c.href === current)}>${c.label}</a>`).join("");
    return `
      <div class="nav-item has-children">
        <a href="${n.href}"${cls(active)}>${n.label}</a>
        <div class="dropdown"><div class="container dropdown-inner">${sub}</div></div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="logo">
        <img src="${SITE.logo}" alt="${SITE.name}" onerror="this.replaceWith('${SITE.name}')">
      </a>
      <button class="nav-toggle" aria-label="메뉴 열기">☰</button>
      <nav class="nav">${items}</nav>
    </div>
    <div class="header-backdrop"></div>`;
  el.querySelector(".nav-toggle").addEventListener("click", () =>
    el.querySelector(".nav").classList.toggle("open"));
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.innerHTML = `
    <div class="container footer-inner">
      ${SITE.schoolLogo ? `<a class="footer-logo" ${SITE.schoolLink ? `href="${SITE.schoolLink}" target="_blank" rel="noopener"` : ""}>
        <img src="${SITE.schoolLogo}" alt="Inha University" onerror="this.parentElement.remove()"></a>` : ""}
      <div class="footer-text">
        <p><strong>${SITE.fullName}</strong> · ${SITE.affiliation}</p>
        ${SITE.address ? `<p>${SITE.address}</p>` : ""}
        ${SITE.Tel ? `<p>Tel. <a href="tel:${SITE.Tel.replace(/[^0-9+]/g, "")}">${SITE.Tel}</a></p>` : ""}
        <p class="muted">© ${new Date().getFullYear()} ${SITE.name}</p>
      </div>
    </div>`;
}

// ---- 날짜 표기 (사이트 전체 공통): "2020-08-01" / "2020-08" → "2020년 08월" ----
function fmtDate(d) {
  const [y, m] = String(d || "").split(/[-.]/);
  if (!y) return "";
  return m ? `${y}년 ${m.padStart(2, "0")}월` : `${y}년`;
}

// ---- 이미지 / 동영상 공통 (동영상은 소리 없이 자동 반복 재생) ----
const isVideo = src => /\.(mp4|webm)$/i.test(src);
const mediaHTML = (src, alt) => isVideo(src)
  ? `<video src="${src}" autoplay muted loop playsinline preload="metadata"></video>`
  : `<img src="${src}" alt="${alt}" loading="lazy">`;

// ---- JSON 읽기 ----
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} 를 읽지 못했습니다 (${res.status})`);
  return res.json();
}

// ---- People ----
// members.json 의 group 값 → 화면에 보이는 섹션 제목 (순서 = 화면 순서)
const PEOPLE_GROUPS = [
  ["Researcher",    "Research Staff"],
  ["PhD",           "Ph.D. Students"],
  ["MS",            "M.S. Students"],
  ["Undergraduate", "Undergraduate Students"],
];
const ALUMNI_DEGREES = [["PhD", "Ph.D."], ["MS", "M.S."], ["BS", "B.S."]];
const PHOTO_PLACEHOLDER = "assets/img/people/placeholder.svg";

const fullName = m =>
  (SITE.showMemberNo && m.no ? `<span class="member-no">${m.no}.</span> ` : "") +
  (m.nameKo ? `${m.name} <span class="name-ko">${m.nameKo}</span>` : m.name);

// ---- 구성원 사진 자동 연결 ----
// people-src/ 에 "한글이름.jpg" (예: 백광준.jpg) 를 넣고 update-site.bat 실행 → assets/img/people/한글이름.webp
// 확장자는 아래 순서로 찾고, 없으면 기본 아이콘. members.json 의 "photo" 에 경로를 적으면 그게 우선.
const PHOTO_EXTS = ["webp", "jpg", "JPG", "jpeg", "png", "PNG"];

function photoImg(m, extra = "") {
  const base = `assets/img/people/${m.nameKo || m.name}`;
  const candidates = m.photo ? [m.photo] : PHOTO_EXTS.map(ext => `${base}.${ext}`);
  const [first, ...rest] = candidates.map(encodeURI);
  return `<img src="${first}" data-fallback="${rest.join("|")}" onerror="photoFallback(this)" alt="${m.name}" ${extra}>`;
}

// 사진 파일이 없으면 다음 확장자 → 마지막엔 기본 아이콘
function photoFallback(img) {
  const rest = (img.dataset.fallback || "").split("|").filter(Boolean);
  if (rest.length) {
    img.dataset.fallback = rest.slice(1).join("|");
    img.src = rest[0];
  } else {
    img.onerror = null;
    img.src = PHOTO_PLACEHOLDER;
  }
}
const listItems = arr => (arr || []).map(x => `<li>${x}</li>`).join("");

// 아이콘 (외부 라이브러리 없이 SVG 직접 사용. 색은 글자색을 따라감)
const svg = path => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const ICONS = {
  email:    svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  phone:    svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  office:   svg('<path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M2 21h20"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>'),
  research: svg('<path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>'),
};

function professorHTML(p) {
  const row = (icon, label, value) => value ? `
    <div class="contact-row">${ICONS[icon]}<span class="contact-label">${label}</span><span>${value}</span></div>` : "";
  return `
    <div class="professor">
      ${photoImg(p)}
      <div>
        <div class="profile-box">   <!-- 이름 ~ 연락처를 한 박스로 -->
          <h3>${fullName(p)}</h3>
          <p class="profile-dept">${p.title}${p.department ? ` · ${p.department}` : ""}</p>
          <div class="contact">
            ${row("email",    "E-mail",   p.email && `<a href="mailto:${p.email}">${p.email}</a>`)}
            ${row("phone",    "Tel",      p.phone)}
            ${row("office",   "Office",   p.office)}
            ${row("research", "Research", p.interests)}
          </div>
        </div>
        ${p.education?.length ? `<h4>Education</h4><ul>${listItems(p.education)}</ul>` : ""}
        ${p.career?.length    ? `<h4>Career</h4><ul>${listItems(p.career)}</ul>` : ""}
        ${p.awards?.length    ? `<h4>Awards</h4><ul>${listItems(p.awards)}</ul>` : ""}
      </div>
    </div>`;
}

// 구성원 카드 (Researcher, Alumni 공통)
//  사진 / 번호 / 영문 이름 / 한글 이름 / 직함(졸업생은 현재 소속) / 연구분야 태그 / 학위논문(졸업생) / 이메일(맨 아래 고정)
function personHTML(m) {
  const tags = (m.interests || "").split(",").map(s => s.trim()).filter(Boolean);
  const subtitle = m.title || m.current;
  return `
    <div class="person">
      ${photoImg(m, 'loading="lazy"')}
      ${SITE.showMemberNo ? `<span class="person-no">${m.no ? `No. ${m.no}` : "&nbsp;"}</span>` : ""}<!-- 번호 없어도 자리 유지 → 이름 높이 맞춤 -->
      <h3>${m.name}</h3>
      ${m.nameKo ? `<p class="person-ko">${m.nameKo}</p>` : ""}
      ${subtitle ? `<p class="person-title">${subtitle}</p>` : ""}
      ${tags.length ? `<ul class="tags">${tags.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
      ${m.thesis ? `<p class="person-thesis"><span>Thesis</span>${m.thesis}</p>` : ""}
      ${m.email ? `<a class="person-email" href="mailto:${m.email}">${m.email}</a>` : ""}
    </div>`;
}

// 번호순 정렬 (번호 없는 사람은 원래 순서대로 앞쪽)
const byNo = (a, b) => (a.no ? Number(a.no) : -1) - (b.no ? Number(b.no) : -1);

function alumniHTML(list) {
  return ALUMNI_DEGREES.map(([key, label]) => {
    const rows = list.filter(a => a.degree === key).sort(byNo);
    if (!rows.length) return "";
    return `
      <h2>${label} <span class="count">${rows.length}</span></h2>
      <div class="people-grid">${rows.map(personHTML).join("")}</div>`;
  }).join("");
}

// 페이지마다 해당 id 가 있는 목록만 그림
//  professor.html   → #professor-list
//  researchers.html → #researcher-list (연구원 + 재학생)
//  alumni.html      → #alumni-list
async function renderPeople() {
  const profEl   = document.getElementById("professor-list");
  const resEl    = document.getElementById("researcher-list");
  const alumniEl = document.getElementById("alumni-list");
  if (!profEl && !resEl && !alumniEl) return;

  const members = await loadJSON("data/members.json");

  if (profEl) {
    profEl.innerHTML = members.filter(m => m.group === "Professor").map(professorHTML).join("");
  }
  if (resEl) {
    resEl.innerHTML = PEOPLE_GROUPS.map(([key, label]) => {
      const list = members.filter(m => m.group === key).sort(byNo);
      if (!list.length) return "";
      return `<h2>${label} <span class="count">${list.length}</span></h2>
              <div class="people-grid">${list.map(personHTML).join("")}</div>`;
    }).join("");
  }
  if (alumniEl) {
    alumniEl.innerHTML = alumniHTML(members.filter(m => m.group === "Alumni"));
  }
}

// ---- Publications (연도별 묶음) ----
async function renderPublications() {
  const el = document.getElementById("pub-list");
  if (!el) return;
  const pubs = await loadJSON("data/publications.json");
  pubs.sort((a, b) => b.year - a.year);
  const years = [...new Set(pubs.map(p => p.year))];
  el.innerHTML = years.map(y => `
    <h2>${y}</h2>
    <ol class="pub-list">
      ${pubs.filter(p => p.year === y).map(p => `
        <li>
          <span class="pub-title">${p.title}</span><br>
          ${p.authors ? `<span>${p.authors}</span><br>` : ""}
          <em>${p.venue}</em>
          ${p.link ? ` · <a href="${p.link}" target="_blank" rel="noopener">Link</a>` : ""}
        </li>`).join("")}
    </ol>`).join("");
}

// ---- Presentations (International / Domestic → 연도별) ----
async function renderPresentations() {
  const el = document.getElementById("presentation-list");
  if (!el) return;
  const items = await loadJSON("data/presentations.json");
  const section = (type, label) => {
    const list = items.filter(p => p.type === type).sort((a, b) => b.year - a.year);
    const years = [...new Set(list.map(p => p.year))];
    return !list.length ? "" : `
      <h2>${label}</h2>
      ${years.map(y => `
        <h3>${y}</h3>
        <ol class="pub-list">
          ${list.filter(p => p.year === y).map(p => `
            <li><span class="pub-title">${p.title}</span><br><em>${p.venue}</em></li>`).join("")}
        </ol>`).join("")}`;
  };
  el.innerHTML = section("international", "International") + section("domestic", "Domestic");
}

// ---- Patents (연도별) ----
// title = 한글 제목, titleEn = 영문 제목, number = 특허번호 (있으면 표시)
async function renderPatents() {
  const el = document.getElementById("patent-list");
  if (!el) return;
  const items = (await loadJSON("data/patents.json")).sort((a, b) => b.year - a.year);
  const years = [...new Set(items.map(p => p.year))];
  el.innerHTML = years.map(y => `
    <h2>${y}</h2>
    <ol class="pub-list">
      ${items.filter(p => p.year === y).map(p => `
        <li>
          <span class="pub-title">${p.title || p.titleEn}</span>
          ${p.title && p.titleEn ? `<br><span class="muted">${p.titleEn}</span>` : ""}
          ${p.number ? `<br><em>${p.number}</em>` : ""}
        </li>`).join("")}
    </ol>`).join("");
}

// ---- Research Fields / Facilities ----
// data/research.json 은 update-site.bat 이 research-src/ 폴더에서 자동 생성
// 페이지: <div id="research-list" data-category="fields|facilities">
async function renderResearch() {
  const el = document.getElementById("research-list");
  if (!el) return;
  const topics = (await loadJSON("data/research.json"))[el.dataset.category] || [];
  if (!topics.length) { el.innerHTML = "<p class='muted'>준비 중입니다.</p>"; return; }

  el.innerHTML = `
    <nav class="topic-nav">${topics.map(t => `<a href="#${t.id}">${t.title}</a>`).join("")}</nav>
    ${topics.map((t, ti) => `
      <section class="topic" id="${t.id}">
        <h2>${t.title}</h2>
        ${(t.text || "").split("\n").map(l => l.trim() ? `<p>${l}</p>` : "").join("")}
        ${t.images.length ? `
          <div class="topic-images">
            ${t.images.map((src, i) => isVideo(src) ? mediaHTML(src) : `
              <a href="${src}" data-topic="${ti}"><img src="${src}" alt="${t.title} ${i + 1}" loading="lazy"></a>`).join("")}
          </div>` : `<p class="muted">이미지 준비 중</p>`}
      </section>`).join("")}`;

  // 이미지 클릭 → 크게 보기 (gallery.js 의 확대 보기 재사용)
  el.querySelectorAll(".topic-images a").forEach(a => a.addEventListener("click", e => {
    if (typeof openLightbox !== "function") return;            // gallery.js 없으면 그냥 이미지 열기
    e.preventDefault();
    const imgs = topics[a.dataset.topic].images.filter(src => !isVideo(src));   // 동영상은 확대 보기에서 제외
    openLightbox(imgs.map(full => ({ full })), imgs.indexOf(a.getAttribute("href")));
  }));
}

// ---- Projects ----
// 종료일(end)이 오늘 이후면 Ongoing, 지났으면 Completed 로 자동 분류.
// 순서는 data/projects.json 에 적힌 순서 그대로 (새 과제는 맨 위에 추가)
async function renderProjects() {
  const el = document.getElementById("project-list");
  if (!el) return;
  const projects = await loadJSON("data/projects.json");
  const today = new Date().toLocaleDateString("sv-SE");   // YYYY-MM-DD
  const section = (label, list) => !list.length ? "" : `
    <h2>${label}</h2>
    <ul class="project-list">
      ${list.map(p => `
        <li>
          <span class="pub-title">${p.title}</span><br>
          <span class="muted">${p.agency} · ${fmtDate(p.start)} ~ ${fmtDate(p.end)}</span>
        </li>`).join("")}
    </ul>`;
  el.innerHTML =
    section("Ongoing Projects",   projects.filter(p => p.end >= today)) +
    section("Completed Projects", projects.filter(p => p.end <  today));
}

// ---- Home: Conference / Research / News 3칸 슬라이드 (Wix 홈과 같은 배치) ----
const HOME = {
  slides: 5,                                       // Conference, News 칸에 넘겨 볼 최근 항목 수
                                                   // Research 칸 = Research Fields 각 주제의 첫 이미지 (research-src/fields)
  heroImage: "assets/img/home/hero.webp",          // 맨 위 배경 (home-src/hero.jpg 넣고 update-site.bat)
  heroPosition: "center",                          // 배경에서 보일 부분: "center", "center top", "30% 50%" 등
  researchLink: "research-fields.html",
};

// 맨 위 배경 이미지: 파일이 있을 때만 적용 (없으면 기존 회색 배경)
function renderHero() {
  const hero = document.querySelector(".hero");
  if (!hero || !HOME.heroImage) return;
  const img = new Image();
  img.onload = () => {
    hero.style.backgroundImage =
      `linear-gradient(rgba(8, 24, 44, .55), rgba(8, 24, 44, .65)), url("${HOME.heroImage}")`;
    hero.style.backgroundPosition = HOME.heroPosition;
    hero.classList.add("has-image");
  };
  img.src = HOME.heroImage;
}

async function renderHomeHighlights() {
  const el = document.getElementById("home-highlights");
  if (!el) return;
  const [gallery, news, research] = await Promise.all([
    loadJSON("data/gallery.json").catch(() => ({})),
    loadJSON("data/news.json").catch(() => []),
    loadJSON("data/research.json").catch(() => ({})),
  ]);

  const conference = (gallery.conference || []).filter(a => a.cover).slice(0, HOME.slides).map(a => ({
    img: a.cover, title: a.title, sub: fmtDate(a.date), href: `conference.html?album=${encodeURIComponent(a.id)}`,
  }));
  const latestNews = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, HOME.slides).map(n => ({
    img: n.images?.[0]?.thumb, title: n.title, sub: fmtDate(n.date), href: `news.html?id=${encodeURIComponent(n.id)}`,
  }));
  const fields = (research.fields || []).filter(t => t.images.length).map(t => ({
    img: t.images[0], title: t.title, sub: "Research Fields", href: `${HOME.researchLink}#${encodeURIComponent(t.id)}`,
  }));

  const card = (label, more, slides) => `
    <div class="highlight highlight-${label.toLowerCase()}">
      <div class="highlight-head"><h3>${label}</h3><a href="${more}">More →</a></div>
      <div class="slide-frame">
        ${slides.length ? slides.map((s, i) => `
          <a class="slide${i ? "" : " active"}" href="${s.href}" data-title="${s.title}" data-sub="${s.sub}">
            ${!s.img ? "" : isVideo(s.img) ? mediaHTML(s.img) : `<img src="${s.img}" alt="${s.title}" loading="lazy" onerror="this.remove()">`}
            <span class="slide-noimg">${label}</span>
          </a>`).join("") : `<div class="slide active"><span class="slide-noimg">준비 중</span></div>`}
        ${slides.length > 1 ? `
          <button class="slide-prev" aria-label="이전">‹</button>
          <button class="slide-next" aria-label="다음">›</button>
          <span class="slide-count">1 / ${slides.length}</span>` : ""}
      </div>
      <a class="slide-caption" href="${slides[0]?.href || more}">
        <span class="slide-title">${slides[0]?.title || ""}</span>
        <span class="muted">${slides[0]?.sub || ""}</span>
      </a>
    </div>`;

  el.innerHTML =
    card("Conference", "conference.html", conference) +
    card("Research", HOME.researchLink, fields) +
    card("News", "news.html", latestNews);

  // 슬라이드 넘기기 (‹ › 버튼)
  el.querySelectorAll(".highlight").forEach(box => {
    const slides = box.querySelectorAll("a.slide");
    if (slides.length < 2) return;
    const caption = box.querySelector(".slide-caption");
    let i = 0;
    const show = k => {
      slides[i].classList.remove("active");
      i = (k + slides.length) % slides.length;
      const s = slides[i];
      s.classList.add("active");
      caption.href = s.getAttribute("href");
      caption.querySelector(".slide-title").textContent = s.dataset.title;
      caption.querySelector(".muted").textContent = s.dataset.sub;
      box.querySelector(".slide-count").textContent = `${i + 1} / ${slides.length}`;
    };
    box.querySelector(".slide-prev").onclick = () => show(i - 1);
    box.querySelector(".slide-next").onclick = () => show(i + 1);
  });
}

// ---- News (data-limit 속성이 있으면 최근 N개만: 홈 화면용) ----
// data/news.json 은 update-site.bat 이 news-src/ 폴더에서 자동 생성 (직접 고치지 않음)
//  항목: { id, date, title, summary, body, images: [{thumb, full}, ...] }
//  - 목록: 썸네일(images 첫 장) + summary (없으면 body 앞부분)
//  - 기사: body 만 (summary 는 표시 안 함). 본문 속 [사진N] 줄은 N번째 사진으로 바뀌고, 안 쓴 사진은 맨 아래
// 화면:
//  - 홈(data-limit 있음)  → 날짜 + 제목 한 줄 목록
//  - news.html            → 썸네일 목록
//  - news.html?id=...     → 상세 (본문 + 사진 전체)
const NEWS_PER_PAGE = 10;   // News 목록 한 페이지에 보이는 글 수

async function renderNews() {
  const el = document.getElementById("news-list");
  if (!el) return;
  const news = await loadJSON("data/news.json");
  news.sort((a, b) => b.date.localeCompare(a.date));

  news.forEach(n => { n.images = n.images || []; });
  const link = n => `news.html?id=${encodeURIComponent(n.id)}`;
  // 목록용 요약: 요약.txt, 없으면 본문 ([사진N] 줄 제외)
  const summaryOf = n => n.summary ||
    (n.body || "").split("\n").filter(l => !/^\[사진\s*\d+\]$/.test(l.trim())).join("\n").trim();

  // 홈: 최근 N개 한 줄 목록
  const limit = Number(el.dataset.limit);
  if (limit) {
    el.innerHTML = news.slice(0, limit).map(n => `
      <li><span class="date">${fmtDate(n.date)}</span> <a href="${link(n)}">${n.title}</a></li>`).join("");
    return;
  }

  // 상세
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const item = id && news.find(n => n.id === id);
  if (item) {
    document.title += ` | ${item.title}`;
    const photo = img => `<img src="${img.full}" alt="${item.title}" loading="lazy">`;
    const used = new Set();
    // 요약은 목록에서만, 기사에는 본문만 (본문이 없으면 요약)
    const body = (item.body || item.summary || "").split("\n").map(line => {
      const m = line.trim().match(/^\[사진\s*(\d+)\]$/);
      const img = m && item.images[Number(m[1]) - 1];
      if (img) { used.add(img); return photo(img); }
      const url = line.match(/^(.*?)\s*(https?:\/\/\S+)$/);           // "원문 기사: https://..." → 링크
      if (url) return `<p class="news-link">${url[1]} <a href="${url[2]}" target="_blank" rel="noopener">바로가기 ↗</a></p>`;
      return line.trim() ? `<p>${line}</p>` : "";
    }).join("");
    const backPage = Math.floor(news.indexOf(item) / NEWS_PER_PAGE) + 1;
    el.outerHTML = `
      <article class="news-detail">
        <p><a href="news.html${backPage > 1 ? `?page=${backPage}` : ""}">← News 목록</a></p>
        <h2>${item.title}</h2>
        <p class="muted">${fmtDate(item.date)}</p>
        ${body}
        ${item.images.filter(img => !used.has(img)).map(photo).join("")}
      </article>`;
    return;
  }

  // 썸네일 목록 (NEWS_PER_PAGE 개씩 페이지 나눔: news.html?page=2)
  const pages = Math.max(1, Math.ceil(news.length / NEWS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  el.innerHTML = news.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE).map(n => `
    <li>
      <a class="news-item" href="${link(n)}">
        ${n.images[0] ? `<img src="${n.images[0].thumb}" alt="" loading="lazy">` : `<div class="news-noimg">${SITE.name}</div>`}
        <div>
          <span class="date">${fmtDate(n.date)}</span>
          <h3>${n.title}</h3>
          ${summaryOf(n) ? `<p class="news-summary">${summaryOf(n)}</p>` : ""}
        </div>
      </a>
    </li>`).join("");
  if (pages > 1) {
    const href = p => `news.html${p > 1 ? `?page=${p}` : ""}`;
    const btn = (p, label, cls = "") => `<a class="${cls}" href="${href(p)}">${label}</a>`;
    el.insertAdjacentHTML("afterend", `<nav class="pagination" aria-label="News 페이지">
      ${page > 1 ? btn(page - 1, "‹ 이전") : ""}
      ${Array.from({ length: pages }, (_, i) => btn(i + 1, i + 1, i + 1 === page ? "current" : "")).join("")}
      ${page < pages ? btn(page + 1, "다음 ›") : ""}
    </nav>`);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  renderFooter();
  renderHero();
  try {
    await Promise.all([renderPeople(), renderPublications(), renderProjects(), renderPresentations(), renderPatents(), renderNews(), renderHomeHighlights(), renderResearch()]);
  } catch (e) {
    console.error(e);
    if (location.protocol === "file:") {
      alert("JSON 데이터는 파일 더블클릭(file://)으로는 안 읽힙니다.\nstart-server.bat 을 실행한 뒤 http://localhost:8000 으로 접속하세요.");
    }
  }
});
