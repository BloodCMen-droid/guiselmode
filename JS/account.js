/* ═══════════════════════════════════════════
   ACCOUNT PANEL — JS/account.js
   Requiere: modal.js cargado antes
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  const API_USUARIOS  = 'https://catalogo-gym-backend-production.up.railway.app/api/usuarios';
  // Tu Cloudinary — reemplaza con tus datos
  const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/imgapi/image/upload';
  const CLOUDINARY_PRESET = 'gym_preset'; // upload preset sin firma (unsigned)

  // ── Inyectar HTML del panel ──────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <div class="acc-overlay" id="accOverlay"></div>
    <div class="acc-panel" id="accPanel">

      <div class="acc-panel__head">
        <div class="acc-panel__title">G<span>&amp;</span>M</div>
        <button class="acc-panel__close" id="accClose" aria-label="Cerrar panel">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="acc-panel__body" id="accBody"></div>

      <div class="acc-panel__footer" id="accFooter" style="display:none">
        <button class="acc-btn-logout" id="accLogout">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
        </button>
      </div>

    </div>
  `);

  const overlay    = document.getElementById('accOverlay');
  const panel      = document.getElementById('accPanel');
  const body       = document.getElementById('accBody');
  const footer     = document.getElementById('accFooter');
  const btnClose   = document.getElementById('accClose');
  const btnLogout  = document.getElementById('accLogout');
  const btnAccount = document.getElementById('btnAccount');

  // ── Abrir / cerrar ───────────────────────────────────────────
  function openPanel() {
    renderPanel();
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btnAccount.addEventListener('click', openPanel);
  btnClose.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // ── Render según sesión ──────────────────────────────────────
  function renderPanel() {
    const raw  = sessionStorage.getItem('gmUser');
    const user = raw ? JSON.parse(raw) : null;
    user ? renderProfile(user) : renderGuest();
  }

  // ── SIN SESIÓN ───────────────────────────────────────────────
  function renderGuest() {
    footer.style.display = 'none';
    body.innerHTML = `
      <div class="acc-guest">
        <div class="acc-guest__icon">
          <i class="fa-regular fa-user"></i>
        </div>
        <div class="acc-guest__tagline">
          BIENVENIDO A<br><span>G&amp;M</span>
        </div>
        <p class="acc-guest__sub">Inicia sesión para acceder a tu perfil</p>
        <div class="acc-guest__btns">
          <button class="acc-btn-primary" id="accGuestLogin">
            <i class="fa-solid fa-right-to-bracket"></i>&nbsp; Iniciar sesión
          </button>
          <div class="acc-guest__divider"><span>o</span></div>
          <button class="acc-btn-outline" id="accGuestRegister">
            <i class="fa-solid fa-user-plus"></i>&nbsp; Registrarse
          </button>
        </div>
      </div>`;

    document.getElementById('accGuestLogin').addEventListener('click', () => {
      closePanel();
      window.openLoginModal?.('login');
    });
    document.getElementById('accGuestRegister').addEventListener('click', () => {
      closePanel();
      window.openLoginModal?.('registro');
    });
  }

  // ── CON SESIÓN ───────────────────────────────────────────────
  function renderProfile(user) {
    footer.style.display = 'block';

    const inicial   = (user.nombre || 'U').charAt(0).toUpperCase();
    const avatarSrc = user.avatarUrl || localStorage.getItem(`gm_avatar_${user.id}`);
    const rolLabel  = user.rol === 'admin' ? 'Administrador' : 'Cliente';

    const avatarHTML = avatarSrc
      ? `<img class="acc-avatar" src="${avatarSrc}" alt="Avatar" id="accAvatarImg">`
      : `<div class="acc-avatar-initial" id="accAvatarImg">${inicial}</div>`;

    body.innerHTML = `
      <div class="acc-profile">
        <div class="acc-profile__hero">
          <div class="acc-avatar-wrap" id="accAvatarWrap" title="Cambiar foto de perfil">
            ${avatarHTML}
            <div class="acc-avatar-overlay">
              <i class="fa-solid fa-camera"></i>
            </div>
            <div class="acc-avatar-badge">
              <i class="fa-solid fa-plus"></i>
            </div>
            <input type="file" id="accAvatarInput" accept="image/*">
          </div>
          <div class="acc-profile__name">${user.nombre || 'Usuario'}</div>
          <div class="acc-profile__email">${user.email || ''}</div>
          <div class="acc-role-badge">${rolLabel}</div>
        </div>

        <div class="acc-upload-status" id="accUploadStatus"></div>

        <div class="acc-profile__info">
          <div class="acc-info-row">
            <div class="acc-info-label">Nombre</div>
            <div class="acc-info-value">${user.nombre || '—'}</div>
          </div>
          <div class="acc-info-row">
            <div class="acc-info-label">Correo electrónico</div>
            <div class="acc-info-value">${user.email || '—'}</div>
          </div>
          <div class="acc-info-row">
            <div class="acc-info-label">Rol</div>
            <div class="acc-info-value">${rolLabel}</div>
          </div>
        </div>

        <div class="acc-coming-soon">
          <div class="acc-coming-soon__icons">
            <i class="fa-regular fa-heart"></i>
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="acc-coming-soon__label">Próximamente</div>
          <div class="acc-coming-soon__text">Favoritos y lista de deseos</div>
        </div>
      </div>`;

    const avatarWrap  = document.getElementById('accAvatarWrap');
    const avatarInput = document.getElementById('accAvatarInput');
    avatarWrap.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
      if (avatarInput.files[0]) handleAvatarUpload(avatarInput.files[0], user);
    });
  }

  // ── Flujo de subida ──────────────────────────────────────────
  // 1. Sube la imagen directo a Cloudinary (unsigned upload)
  // 2. Con la URL devuelta, hace PATCH al backend para guardarla
  async function handleAvatarUpload(file, user) {
    const status = document.getElementById('accUploadStatus');

    if (!file.type.startsWith('image/')) {
      showStatus(status, 'error', 'Solo se permiten imágenes.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showStatus(status, 'error', 'La imagen no debe superar 3MB.');
      return;
    }

    showStatus(status, 'loading', '<span class="acc-loader"></span> Subiendo imagen…');

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setAvatarSrc(localUrl);
    updateNavbarAvatar(localUrl, user);

    try {
      // ── Paso 1: subir a Cloudinary ──────────────────────────
      const formData = new FormData();
      formData.append('file',           file);
      formData.append('upload_preset',  CLOUDINARY_PRESET);
      formData.append('folder',         'gm_avatars');

      const cloudRes = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body:   formData
      });
      if (!cloudRes.ok) throw new Error('Cloudinary upload failed');

      const cloudData = await cloudRes.json();
      const url = cloudData.secure_url;

      // ── Paso 2: guardar URL en el backend ───────────────────
      const backendRes = await fetch(`${API_USUARIOS}/${user.id}/avatar`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: url })
      });
      if (!backendRes.ok) throw new Error('Backend save failed');

      const usuarioActualizado = await backendRes.json();

      // ── Persistir en sesión ─────────────────────────────────
      const updatedUser = { ...user, avatarUrl: url };
      sessionStorage.setItem('gmUser', JSON.stringify(updatedUser));
      localStorage.setItem(`gm_avatar_${user.id}`, url);

      setAvatarSrc(url);
      updateNavbarAvatar(url, updatedUser);
      showStatus(status, 'success', '<i class="fa-solid fa-check"></i> Foto actualizada');
      setTimeout(() => { status.style.display = 'none'; }, 3000);

    } catch (err) {
      console.error(err);
      showStatus(status, 'error', 'Error al subir. Intenta de nuevo.');
    }
  }

  function setAvatarSrc(url) {
    const el = document.getElementById('accAvatarImg');
    if (!el) return;
    if (el.tagName === 'IMG') {
      el.src = url;
    } else {
      const img = Object.assign(document.createElement('img'), {
        className: 'acc-avatar', src: url, alt: 'Avatar', id: 'accAvatarImg'
      });
      el.replaceWith(img);
    }
  }

  function showStatus(el, type, html) {
    el.className = `acc-upload-status ${type}`;
    el.innerHTML = html;
  }

  // ── Actualizar botón Account en el navbar ────────────────────
  function updateNavbarAvatar(url, user) {
    const btn = document.getElementById('btnAccount');
    if (!btn) return;
    const inicial = (user.nombre || 'U').charAt(0).toUpperCase();
    const icon = btn.querySelector('i, .acc-nav-avatar, .acc-nav-initial');
    const span = btn.querySelector('span');

    if (icon) {
      const newEl = url
        ? Object.assign(document.createElement('img'), {
            src: url, alt: inicial, className: 'acc-nav-avatar'
          })
        : Object.assign(document.createElement('span'), {
            className: 'acc-nav-initial', textContent: inicial
          });
      icon.replaceWith(newEl);
    }
    if (span) span.textContent = user.nombre?.split(' ')[0] || 'Perfil';
  }

  // ── Logout ───────────────────────────────────────────────────
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('gmUser');
    closePanel();

    const btn = document.getElementById('btnAccount');
    if (btn) {
      const old = btn.querySelector('.acc-nav-avatar, .acc-nav-initial');
      if (old) old.replaceWith(Object.assign(document.createElement('i'), {
        className: 'fa-regular fa-user'
      }));
      const span = btn.querySelector('span');
      if (span) span.textContent = 'Account';
    }

    window.location.href = location.origin + '/guiselmode/index.html';
  });

  // ── Init: restaurar navbar si ya hay sesión ──────────────────
  (function initNavbar() {
    const raw = sessionStorage.getItem('gmUser');
    if (!raw) return;
    const user = JSON.parse(raw);
    const url  = user.avatarUrl || localStorage.getItem(`gm_avatar_${user.id}`) || null;
    updateNavbarAvatar(url, user);
  })();

});