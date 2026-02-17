/* ==========================================================
   少林寺拳法部 追いコン 2026 - 編集機能
   editor.js
   ========================================================== */

'use strict';

// パスワード（必要に応じて変更）
const ADMIN_PASSWORD = 'shorinji2026';

document.addEventListener('DOMContentLoaded', () => {
  initLoginModal();
  initEditBar();
  initImageEditor();
  initLinkEditor();
  initTextToolbar();
});

/* ==========================================================
   ログインモーダル
   ========================================================== */
function initLoginModal() {
  const overlay    = document.querySelector('.modal-overlay');
  const loginBtn   = document.querySelector('.footer-login-btn');
  const submitBtn  = document.querySelector('.modal-submit');
  const closeBtn   = document.querySelector('.modal-close');
  const input      = document.querySelector('.modal-input');
  const errorMsg   = document.querySelector('.modal-error');
  const logoutBtn  = document.getElementById('logout-btn');

  if (!overlay) return;

  // 現在のログイン状態を反映
  updateLoginUI();

  // ログインボタン
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (localStorage.getItem('admin_logged_in') === 'true') {
        // 既にログイン中 → ログアウト確認
        if (confirm('ログアウトしますか？')) {
          doLogout();
        }
      } else {
        overlay.classList.add('open');
        input.value = '';
        if (errorMsg) errorMsg.textContent = '';
        setTimeout(() => input.focus(), 100);
      }
    });
  }

  // モーダル閉じる
  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  // Enterキーでも送信
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') tryLogin();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', tryLogin);
  }

  // ログアウトボタン（editbarにある）
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('ログアウトしますか？')) doLogout();
    });
  }

  function tryLogin() {
    const val = input ? input.value.trim() : '';
    if (val === ADMIN_PASSWORD) {
      localStorage.setItem('admin_logged_in', 'true');
      overlay.classList.remove('open');
      updateLoginUI();
      if (window.SiteApp) window.SiteApp.enableEditMode(true);
    } else {
      if (errorMsg) {
        errorMsg.textContent = 'パスワードが違います';
        errorMsg.style.animation = 'none';
        requestAnimationFrame(() => { errorMsg.style.animation = ''; });
      }
      if (input) input.select();
    }
  }

  function doLogout() {
    localStorage.removeItem('admin_logged_in');
    updateLoginUI();
    if (window.SiteApp) window.SiteApp.disableEditMode();
    if (window.SiteApp) window.SiteApp.showToast('ログアウトしました');
  }

  function updateLoginUI() {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    if (loginBtn) {
      loginBtn.textContent = isLoggedIn ? '🔓 ログアウト' : '🔒 Login';
    }
  }
}

/* ==========================================================
   編集バー（下部固定）
   ========================================================== */
function initEditBar() {
  const saveBtn = document.getElementById('save-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (window.SiteApp) {
        window.SiteApp.savePage();
        window.SiteApp.showToast('✓ 保存しました');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('このページの編集内容をすべてリセットしますか？\n（保存済みデータが削除されます）')) {
        if (window.SiteApp) localStorage.removeItem(window.SiteApp.PAGE_KEY);
        location.reload();
      }
    });
  }
}

/* ==========================================================
   画像編集
   ========================================================== */
function initImageEditor() {
  // 編集モードONのときのみクリックを有効にする
  document.querySelectorAll('.img-change-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!document.body.classList.contains('edit-mode-on')) return;

      const wrapper   = btn.closest('.img-edit-wrapper');
      const targetId  = btn.dataset.targetId;
      const isBg      = btn.dataset.isBg === 'true';

      openFilePicker(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const src = e.target.result;
          if (isBg) {
            // 背景画像として適用
            const bgEl = wrapper.querySelector('[data-bg-id]') || wrapper;
            bgEl.style.backgroundImage = `url(${src})`;
          } else {
            // <img> タグとして適用
            const imgEl = wrapper.querySelector('img#' + targetId) ||
                          wrapper.querySelector('img');
            if (imgEl) imgEl.src = src;
          }
          // localStorageに保存
          saveImage(targetId, src);
          if (window.SiteApp) window.SiteApp.showToast('📷 画像を変更しました');
        };
        reader.readAsDataURL(file);
      });
    });
  });
}

function openFilePicker(callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) callback(input.files[0]);
  });
  input.click();
}

function saveImage(id, src) {
  if (!window.SiteApp) return;
  const key   = window.SiteApp.PAGE_KEY;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (!saved.images) saved.images = {};
  saved.images[id] = src;
  localStorage.setItem(key, JSON.stringify(saved));
}

/* ==========================================================
   リンク編集
   ========================================================== */
function initLinkEditor() {
  document.querySelectorAll('.link-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation(); // カードへのイベントを止める
      if (!document.body.classList.contains('edit-mode-on')) return;

      const card = btn.closest('.card');
      const currentUrl = card ? card.dataset.href : '';

      const newUrl = prompt('URLを入力してください：', currentUrl || 'https://');
      if (newUrl === null) return;

      if (card) {
        card.dataset.href = newUrl;
        if (window.SiteApp) {
          window.SiteApp.showToast('🔗 URLを更新しました');
          window.SiteApp.savePage();
        }
      }
    });
  });
}

/* ==========================================================
   テキストツールバー（書式変更）
   ========================================================== */
function initTextToolbar() {
  const toolbar = document.getElementById('text-toolbar');
  if (!toolbar) return;

  const fontSelect  = document.getElementById('tb-font');
  const sizeInput   = document.getElementById('tb-size');
  const colorInput  = document.getElementById('tb-color');
  const boldBtn     = document.getElementById('tb-bold');
  const italicBtn   = document.getElementById('tb-italic');

  let currentEl = null;

  // フォーカスされたeditable要素を記憶してツールバーを表示
  document.addEventListener('focusin', e => {
    const el = e.target.closest('.editable[contenteditable="true"]');
    if (!el || !document.body.classList.contains('edit-mode-on')) {
      toolbar.classList.remove('visible');
      return;
    }
    currentEl = el;
    showToolbar(el);
  });

  document.addEventListener('focusout', e => {
    // ツールバー自体をクリックした場合は閉じない
    if (toolbar.contains(e.relatedTarget)) return;
    setTimeout(() => {
      if (!document.activeElement.closest('.editable') &&
          !toolbar.contains(document.activeElement)) {
        toolbar.classList.remove('visible');
        currentEl = null;
      }
    }, 100);
  });

  function showToolbar(el) {
    const rect = el.getBoundingClientRect();
    toolbar.classList.add('visible');

    // 現在スタイルを反映
    const style = window.getComputedStyle(el);
    if (fontSelect) {
      const ff = (el.style.fontFamily || style.fontFamily).replace(/['"]/g,'').split(',')[0].trim();
      fontSelect.value = ff || 'Noto Sans JP';
    }
    if (sizeInput) {
      sizeInput.value = parseInt(el.style.fontSize || style.fontSize) || 16;
    }
    if (colorInput) {
      const color = el.style.color || style.color;
      colorInput.value = rgbToHex(color);
    }

    // ツールバー位置調整
    const tbRect = toolbar.getBoundingClientRect();
    let top  = rect.top + window.scrollY - toolbar.offsetHeight - 10;
    let left = rect.left + window.scrollX;
    if (top < window.scrollY + 10) top = rect.bottom + window.scrollY + 10;
    left = Math.min(left, window.innerWidth - toolbar.offsetWidth - 10);
    left = Math.max(left, 10);
    toolbar.style.top  = top + 'px';
    toolbar.style.left = left + 'px';
  }

  // フォント変更
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      if (!currentEl) return;
      currentEl.style.fontFamily = fontSelect.value;
    });
  }

  // サイズ変更
  if (sizeInput) {
    sizeInput.addEventListener('input', () => {
      if (!currentEl) return;
      currentEl.style.fontSize = sizeInput.value + 'px';
    });
  }

  // 色変更
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      if (!currentEl) return;
      currentEl.style.color = colorInput.value;
    });
  }

  // 太字
  if (boldBtn) {
    boldBtn.addEventListener('click', () => {
      document.execCommand('bold');
      if (currentEl) currentEl.focus();
    });
  }

  // 斜体
  if (italicBtn) {
    italicBtn.addEventListener('click', () => {
      document.execCommand('italic');
      if (currentEl) currentEl.focus();
    });
  }
}

/* RGBをHexに変換 */
function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '#2d2d2d';
  return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}
