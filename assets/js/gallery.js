// =====================================================================
// 갤러리 (conference.html, activity.html 에서만 불러옴)
//  - 페이지.html            → 앨범 목록 (연도별)
//  - 페이지.html?album=ID   → 앨범 안 사진 그리드
//  - 사진 클릭              → 확대 보기 (← → 키, ESC 닫기)
// 데이터: data/gallery.json  (update-site.bat 이 자동 생성)
// =====================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const el = document.getElementById("gallery");
  if (!el) return;
  const category = el.dataset.category;

  let albums;
  try {
    albums = (await loadJSON("data/gallery.json"))[category] || [];
  } catch (e) {
    el.innerHTML = "<p>갤러리 데이터를 불러오지 못했습니다. update-site.bat 을 먼저 실행하세요.</p>";
    return;
  }

  const albumId = new URLSearchParams(location.search).get("album");
  const album = albumId && albums.find(a => a.id === albumId);
  if (album) renderAlbum(el, album);
  else renderAlbumList(el, albums);
});

function renderAlbumList(el, albums) {
  if (!albums.length) { el.innerHTML = "<p>아직 앨범이 없습니다.</p>"; return; }
  const years = [...new Set(albums.map(a => a.year))];
  el.innerHTML = years.map(y => `
    <h2>${y ?? "기타"}</h2>
    <div class="album-grid">
      ${albums.filter(a => a.year === y)
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""))   // 같은 연도 안에서는 오래된 순
        .map(a => `
        <a class="album-card" href="?album=${encodeURIComponent(a.id)}">
          ${a.cover ? `<img src="${a.cover}" alt="${a.title}" loading="lazy">` : `<div class="album-nocover">${a.title}</div>`}
          <span class="album-title">${a.title}</span>
          <span class="muted">${[fmtDate(a.date), a.photos.length && `${a.photos.length}장`, countOf(a) && `${countOf(a)}명`].filter(Boolean).join(" · ")}</span>
        </a>`).join("")}
    </div>`).join("");
}

function renderAlbum(el, album) {
  document.title += ` | ${album.title}`;
  el.innerHTML = `
    <p><a href="${location.pathname.split("/").pop()}">← 앨범 목록</a></p>
    <h2>${album.title} <span class="muted">${fmtDate(album.date)}</span></h2>
    ${infoHTML(album.info)}
    <div class="photo-grid">
      ${album.photos.map((p, i) => `
        <a href="${p.full}" data-index="${i}">
          <img src="${p.thumb}" alt="${album.title} ${i + 1}" loading="lazy">
        </a>`).join("")}
    </div>`;
  el.querySelectorAll(".photo-grid a").forEach(a =>
    a.addEventListener("click", e => {
      e.preventDefault();
      openLightbox(album.photos, Number(a.dataset.index));
    }));
}

// ---- 앨범 정보 (앨범 폴더의 정보.txt) ----
const countOf = a => (a.info || []).find(f => f.count)?.count;

function infoHTML(info) {
  if (!info || !info.length) return "";
  const talk = t => `<li>${t.name ? `<strong>${t.name}</strong> ` : ""}${t.title}</li>`;
  return `<dl class="album-info">${info.map(f => `
    <dt>${f.label}${f.count ? ` <span class="muted">(${f.count}명)</span>` : ""}</dt>
    <dd>${f.items ? `<ul>${f.items.map(talk).join("")}</ul>` : f.value}</dd>`).join("")}
  </dl>`;
}

// ---- 확대 보기 ----
function openLightbox(photos, index) {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = `
    <button class="lb-close" aria-label="닫기">✕</button>
    <button class="lb-prev" aria-label="이전">‹</button>
    <img alt="">
    <button class="lb-next" aria-label="다음">›</button>
    <span class="lb-count"></span>`;
  document.body.appendChild(box);
  document.body.style.overflow = "hidden";
  const img = box.querySelector("img");

  const show = i => {
    index = (i + photos.length) % photos.length;
    img.src = photos[index].full;
    box.querySelector(".lb-count").textContent = `${index + 1} / ${photos.length}`;
    // 다음 사진 미리 받아두기
    new Image().src = photos[(index + 1) % photos.length].full;
  };
  const close = () => {
    box.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = e => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  };

  box.querySelector(".lb-close").onclick = close;
  box.querySelector(".lb-prev").onclick = () => show(index - 1);
  box.querySelector(".lb-next").onclick = () => show(index + 1);
  box.addEventListener("click", e => { if (e.target === box) close(); });  // 바깥 클릭 시 닫기
  document.addEventListener("keydown", onKey);
  show(index);
}
