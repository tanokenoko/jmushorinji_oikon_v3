/* ==========================================================
   少林寺拳法部 追いコン 2026 - メインJavaScript
   main.js
   ========================================================== */

'use strict';

// ─────────────── DOM Ready ───────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHero();
  initTimeline();
  initFadeIn();
  initCheckList();
  loadSavedContent();
  initEditorMode();
});

/* ==========================================================
   ナビゲーション
   ========================================================== */
function initNav() {
  const nav        = document.querySelector('.site-nav');
  const hamburger  = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');

  // ─ スクロールで背景を濃くする
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ─ ハンバーガーメニュー
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // メニュー内リンクをクリックで閉じる
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ─ 現在ページのリンクにactiveクラス
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* ==========================================================
   ヒーローセクション（index.htmlのみ）
   ========================================================== */
function initHero() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  // 画像ロード後に拡大アニメーションを開始
  const bgStyle = window.getComputedStyle(heroBg).backgroundImage;
  const urlMatch = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
  if (urlMatch) {
    const img = new Image();
    img.onload = () => heroBg.classList.add('loaded');
    img.onerror = () => heroBg.classList.add('loaded'); // fallback color でも起動
    img.src = urlMatch[1];
  } else {
    heroBg.classList.add('loaded');
  }

  // スクロールボタン
  const scrollBtn = document.querySelector('.hero-scroll-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const target = document.querySelector('#schedule');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* ==========================================================
   タイムライン（スケジュール）
   ========================================================== */
function initTimeline() {
  const tabs     = document.querySelectorAll('.schedule-tab');
  const days     = document.querySelectorAll('.timeline-day');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.day;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      days.forEach(d => {
        const isActive = d.dataset.day === target;
        d.classList.toggle('active', isActive);
        if (isActive) {
          animateTimelineItems(d);
        }
      });
    });
  });

  // 初期表示
  const firstDay = document.querySelector('.timeline-day.active');
  if (firstDay) animateTimelineItems(firstDay);
}

function animateTimelineItems(container) {
  const items = container.querySelectorAll('.timeline-item');
  items.forEach((item, i) => {
    item.classList.remove('visible');
    setTimeout(() => item.classList.add('visible'), i * 80 + 50);
  });
}

/* ==========================================================
   スクロールフェードイン
   ========================================================== */
function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================
   チェックリスト（info.htmlのみ）
   ========================================================== */
function initCheckList() {
  const checkboxes = document.querySelectorAll('.checklist-check');
  if (!checkboxes.length) return;

  const key = 'checklist_' + location.pathname;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');

  checkboxes.forEach((box, i) => {
    if (saved[i]) box.classList.add('checked');
    box.addEventListener('click', () => {
      box.classList.toggle('checked');
      if (box.classList.contains('checked')) {
        box.textContent = '✓';
      } else {
        box.textContent = '';
      }
      const state = {};
      checkboxes.forEach((b, idx) => { state[idx] = b.classList.contains('checked'); });
      localStorage.setItem(key, JSON.stringify(state));
    });
    // 初期表示
    if (saved[i]) box.textContent = '✓';
  });
}

/* ==========================================================
   カード クリック遷移
   ========================================================== */
document.addEventListener('click', e => {
  const card = e.target.closest('.card[data-href]');
  if (!card) return;
  // 編集モード中はリンク遷移しない
  if (document.body.classList.contains('edit-mode-on')) return;
  const href = card.dataset.href;
  if (href && href !== '#') window.open(href, '_blank', 'noopener');
});

/* ==========================================================
   コンテンツ保存・復元
   ========================================================== */
const PAGE_KEY = 'page_content_' + location.pathname;

function loadSavedContent() {
  const saved = JSON.parse(localStorage.getItem(PAGE_KEY) || '{}');

  // テキスト
  Object.entries(saved.texts || {}).forEach(([id, data]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = data.html || '';
    if (data.fontSize)  el.style.fontSize  = data.fontSize;
    if (data.color)     el.style.color     = data.color;
    if (data.fontFamily)el.style.fontFamily= data.fontFamily;
  });

  // 画像
  Object.entries(saved.images || {}).forEach(([id, src]) => {
    const img = document.getElementById(id);
    if (img && img.tagName === 'IMG') img.src = src;
    // bgimage
    const wrapper = document.querySelector('[data-bg-id="' + id + '"]');
    if (wrapper) wrapper.style.backgroundImage = 'url(' + src + ')';
  });

  // リンク
  Object.entries(saved.links || {}).forEach(([id, href]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'A') el.href = href;
    // card
    const card = el.closest('.card');
    if (card) card.dataset.href = href;
  });

  // 車カード名・メンバー
  if (saved.carData) {
    Object.entries(saved.carData).forEach(([cardId, data]) => {
      const card = document.getElementById(cardId);
      if (!card) return;
      const nameEl = card.querySelector('.car-name');
      if (nameEl && data.name) nameEl.textContent = data.name;
      const membersList = card.querySelector('.car-members-list');
      if (membersList && data.members) {
        membersList.innerHTML = data.members.map(m =>
          `<div class="car-member editable" contenteditable="false">
            <span class="car-member-icon">▶</span>
            <span class="member-name">${escapeHtml(m)}</span>
          </div>`
        ).join('');
      }
    });
  }
}

function savePage() {
  const saved = { texts: {}, images: {}, links: {} };
  const existing = JSON.parse(localStorage.getItem(PAGE_KEY) || '{}');
  saved.images = existing.images || {};

  document.querySelectorAll('[data-editable-id]').forEach(el => {
    const id = el.dataset.editableId;
    saved.texts[id] = {
      html:       el.innerHTML,
      fontSize:   el.style.fontSize   || '',
      color:      el.style.color      || '',
      fontFamily: el.style.fontFamily || '',
    };
  });

  document.querySelectorAll('[data-link-id]').forEach(el => {
    const id = el.dataset.linkId;
    saved.links[id] = el.closest('.card') ? el.closest('.card').dataset.href : el.href;
  });

  localStorage.setItem(PAGE_KEY, JSON.stringify(saved));
}

/* テキスト編集用の data-editable-id を自動付与 */
function assignEditableIds() {
  let count = 0;
  document.querySelectorAll('.editable:not([data-editable-id])').forEach(el => {
    el.setAttribute('data-editable-id', 'editable_' + count++);
  });
}

/* ==========================================================
   編集モード
   ========================================================== */
function initEditorMode() {
  // 既存のedit関連UIはeditor.jsで管理
  // ログイン状態チェック
  if (localStorage.getItem('admin_logged_in') === 'true') {
    enableEditMode(false); // 通知なしで復元
  }
}

function enableEditMode(notify = true) {
  document.body.classList.add('edit-mode-on');
  const bar = document.querySelector('.edit-bar');
  if (bar) bar.classList.add('active');

  // contenteditable を有効化
  document.querySelectorAll('.editable').forEach(el => {
    el.contentEditable = 'true';
    el.spellcheck = false;
  });

  assignEditableIds();
  if (notify) showToast('編集モードON — 変更後は保存ボタンを押してください');
}

function disableEditMode() {
  document.body.classList.remove('edit-mode-on');
  const bar = document.querySelector('.edit-bar');
  if (bar) bar.classList.remove('active');

  document.querySelectorAll('.editable').forEach(el => {
    el.contentEditable = 'false';
  });
}

/* ==========================================================
   トースト通知
   ========================================================== */
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.style.cssText = `
      position:fixed;bottom:80px;right:20px;z-index:9999;
      background:var(--color-primary);color:white;
      font-family:var(--font-sans);font-size:0.82rem;
      padding:0.7rem 1.2rem;border-radius:8px;
      box-shadow:0 4px 20px rgba(0,0,0,0.3);
      border:1px solid rgba(200,169,110,0.3);
      letter-spacing:0.04em;line-height:1.5;
      opacity:0;transform:translateY(10px);
      transition:opacity 0.3s,transform 0.3s;
      pointer-events:none;max-width:280px;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, duration);
}

/* HTML エスケープ */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// グローバル公開
window.SiteApp = {
  enableEditMode,
  disableEditMode,
  savePage,
  showToast,
  PAGE_KEY,
};
