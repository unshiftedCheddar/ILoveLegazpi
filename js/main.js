/* ─── main.js — Legazpi City V1 ─────────────────────────── */

/* NAV scroll state */
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* Mobile menu */
const burger = document.querySelector('.nav-burger');
const mobileNav = document.querySelector('.nav-mobile');
if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* Active nav link */
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  if (a.getAttribute('href') === currentPage || (currentPage === '' && a.getAttribute('href') === 'index.html')) {
    a.classList.add('active');
  }
});

/* Scroll reveal */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ─── Load JSON data ─────────────────────────────────────── */
let _dataCache = null;
async function loadData() {
  if (_dataCache) return _dataCache;
  try {
    const res = await fetch('data/spots.json');
    _dataCache = await res.json();
    return _dataCache;
  } catch (e) {
    console.warn('Could not load data/spots.json', e);
    return null;
  }
}

/* Re-observe newly added .reveal elements */
function observeNew() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}

/* ─── EXPLORE PAGE ───────────────────────────────────────── */
async function initExplore() {
  const grid = document.getElementById('spots-grid');
  if (!grid) return;
  const data = await loadData();
  if (!data) { grid.innerHTML = '<p style="color:var(--muted)">Could not load spots.</p>'; return; }

  const catLabel = { heritage: 'Heritage', nature: 'Nature', culture: 'Culture', leisure: 'Leisure', cuisine: 'Cuisine' };
  let active = 'all';

  function renderCards(spots) {
    grid.innerHTML = spots.map(s => `
      <article class="spot-card reveal" data-id="${s.id}" style="cursor:pointer" role="button" tabindex="0" aria-label="View details for ${s.name}">
        <div class="spot-card-img">
          <img src="${s.image}" alt="${s.name}" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><span style=\\'font-size:2.5rem\\'>🌋</span><span>${s.name}</span></div>'">
          <span class="spot-card-cat cat-${s.category}">${catLabel[s.category] || s.category}</span>
        </div>
        <div class="spot-card-body">
          <div class="spot-card-loc">📍 ${s.barangay}${s.assigned ? `<span style="color:var(--lava);margin-left:6px;font-weight:600">· ${s.assigned}</span>` : ''}</div>
          <h3 class="spot-card-name">${s.name}</h3>
          <p class="spot-card-desc">${s.short}</p>
          <div class="spot-card-tags">${s.tags.map(t => `<span class="spot-tag">${t}</span>`).join('')}</div>
          <div style="margin-top:1rem;font-size:0.78rem;font-weight:600;color:var(--lava);display:flex;align-items:center;gap:4px">View details <span style="font-size:0.9rem">→</span></div>
        </div>
      </article>
    `).join('');
    grid.querySelectorAll('.spot-card[data-id]').forEach(card => {
      const spot = spots.find(s => s.id === card.dataset.id);
      if (!spot) return;
      card.addEventListener('click', () => openSpotModal(spot));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openSpotModal(spot); });
    });
    observeNew();
  }

  function filter(cat) {
    active = cat;
    renderCards(cat === 'all' ? data.spots : data.spots.filter(s => s.category === cat));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  }

  document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => filter(b.dataset.cat)));
  filter('all');
}

/* ─── FOOD PAGE ──────────────────────────────────────────── */
const foodEmojis = { 'bicol-express': '🌶️', 'gulay-na-natong': '🥬', 'laing': '🍃', 'pili-nuts': '🥜', 'hepa-streets': '🍢' };

async function initFood() {
  const grid = document.getElementById('food-grid');
  if (!grid) return;
  const data = await loadData();
  if (!data) return;
  grid.innerHTML = data.food.map(f => `
    <div class="food-card reveal">
      <div class="food-card-emoji">${foodEmojis[f.id] || '🍽️'}</div>
      <div>
        <div class="food-card-type">${f.type}</div>
        <h3 class="food-card-name">${f.name}</h3>
        <p class="food-card-desc">${f.description}</p>
        <div class="food-card-where">📍 ${f.where}</div>
      </div>
    </div>
  `).join('');
  observeNew();
}

/* ─── GALLERY PAGE ───────────────────────────────────────── */
async function initGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const data = await loadData();
  if (!data) return;

  function renderGallery(items) {
    /* lock height before swap so footer doesn't jump */
    grid.style.minHeight = grid.offsetHeight + 'px';
    grid.style.transition = 'opacity 0.18s ease';
    grid.style.opacity = '0';
    setTimeout(() => {
      grid.innerHTML = items.map(g => `
        <div class="gallery-item" data-src="${g.image}" data-caption="${g.caption}">
          <img src="${g.image}" alt="${g.caption}" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><span style=\\'font-size:2rem\\'>📷</span><span>${g.caption}</span></div>'">
          <div class="gallery-caption">${g.caption}</div>
        </div>
      `).join('');
      grid.querySelectorAll('.gallery-item[data-src]').forEach(item => {
        item.addEventListener('click', () => openLightbox(item.dataset.src, item.dataset.caption));
      });
      grid.style.opacity = '1';
      /* release height lock after content has painted */
      requestAnimationFrame(() => { grid.style.minHeight = ''; });
    }, 180);
  }

  function filterGallery(cat) {
    renderGallery(cat === 'all' ? data.gallery : data.gallery.filter(g => g.category === cat));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  }

  document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => filterGallery(b.dataset.cat)));
  filterGallery('all');
}

/* ─── SPOT MODAL ─────────────────────────────────────────── */
const catColors = { heritage: 'cat-heritage', nature: 'cat-nature', culture: 'cat-culture', leisure: 'cat-leisure', cuisine: 'cat-culture' };
const catIcons  = { heritage: '🏛️', nature: '🌋', culture: '🏘️', leisure: '🌊', cuisine: '🍽️' };

function openSpotModal(spot) {
  const overlay = document.getElementById('spot-modal-overlay');
  if (!overlay) return;

  /* photo stack — up to 3 photos from spot.photos array */
  const stackItems = (spot.photos || []).slice(0, 3);
  const shotsHTML = stackItems.length
    ? `<div class="spot-modal-section-label">Photos</div>
       <div class="photo-stack">
         ${stackItems.map(src => `
           <div class="photo-stack-item">
             <img src="${src}" alt="spot photo" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\'photo-stack-placeholder\'>📷</div>'">
           </div>`).join('')}
       </div>`
    : '';

  const tagsHTML = spot.tags && spot.tags.length
    ? `<div class="spot-modal-tags" style="margin-bottom:1rem">${spot.tags.map(t => `<span class="spot-tag">${t}</span>`).join('')}</div>`
    : '';

  const assignedHTML = spot.assigned
    ? `<span class="spot-modal-assigned">📌 ${spot.assigned}</span>`
    : '';

  overlay.querySelector('.spot-modal').innerHTML = `
    <div class="spot-modal-img">
      <img src="${spot.image}" alt="${spot.name}"
        onerror="this.parentElement.innerHTML='<div class=\'spot-modal-img-placeholder\'><span style=\'font-size:3.5rem\'>${catIcons[spot.category] || '📍'}</span><span>${spot.name}</span></div>'">
      <span class="spot-modal-cat ${catColors[spot.category] || ''}">${spot.category}</span>
      <button class="spot-modal-close" aria-label="Close" id="spot-modal-close-btn">×</button>
    </div>
    <div class="spot-modal-body">
      <div class="spot-modal-loc">📍 ${spot.barangay} ${assignedHTML}</div>
      <div class="spot-modal-name">${spot.name}</div>
      ${tagsHTML}
      <p class="spot-modal-desc">${spot.description}</p>
      ${shotsHTML}
    </div>
  `;

  /* wire close button (rendered fresh each open) */
  overlay.querySelector('#spot-modal-close-btn').addEventListener('click', closeSpotModal);

  /* photo stack — click any card to bring it to front */
  const stack = overlay.querySelector('.photo-stack');
  if (stack) {
    const items = Array.from(stack.querySelectorAll('.photo-stack-item'));
    /* assign base positions as data so we can restore them */
    const positions = [
      { rotate: '-7deg', x: '-32px', y: '0px',  z: 1 },
      { rotate:  '2deg', x:   '0px', y: '-8px', z: 2 },
      { rotate:  '9deg', x:  '32px', y: '0px',  z: 1 },
    ];
    function applyPos(el, pos, front) {
      el.style.transform  = front
        ? 'rotate(0deg) translateY(-22px) scale(1.05)'
        : `rotate(${pos.rotate}) translate(${pos.x}, ${pos.y})`;
      el.style.zIndex     = front ? 10 : pos.z;
      el.style.boxShadow  = front
        ? '0 18px 48px rgba(0,0,0,0.28)'
        : '';
    }
    let frontIdx = 1; /* middle card starts on top */
    items.forEach((item, i) => {
      item.style.cursor     = 'pointer';
      item.style.transition = 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.38s ease, z-index 0s';
      applyPos(item, positions[i], i === frontIdx);
      item.addEventListener('click', () => {
        if (i === frontIdx) {
          /* clicking the current front — return middle card to top */
          applyPos(items[frontIdx], positions[frontIdx], false);
          frontIdx = 1;
          applyPos(items[1], positions[1], true);
          return;
        }
        /* restore previous front */
        applyPos(items[frontIdx], positions[frontIdx], false);
        frontIdx = i;
        applyPos(item, positions[i], true);
      });
    });
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSpotModal() {
  const overlay = document.getElementById('spot-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── LIGHTBOX ───────────────────────────────────────────── */
function openLightbox(src, caption) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('img').src = src;
  lb.querySelector('.lightbox-caption').textContent = caption || '';
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  initExplore();
  initFood();
  initGallery();

  /* spot modal overlay — close on backdrop click */
  const spotOverlay = document.getElementById('spot-modal-overlay');
  if (spotOverlay) {
    spotOverlay.addEventListener('click', e => { if (e.target === spotOverlay) closeSpotModal(); });
  }

  /* lightbox */
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  }

  /* escape key closes whichever is open */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSpotModal(); closeLightbox(); }
  });
});
