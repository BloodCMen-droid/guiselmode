/* ═══════════════════════════════════════════
   ACCOUNT PANEL — JS/account.js
   Depende de: modal.js (login/registro)
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  const API_USUARIOS  = 'https://catalogo-gym-backend-production.up.railway.app/api/usuarios';
  const API_IMAGENES  = 'https://catalogo-gym-backend-production.up.railway.app/api/imagenes';

  // ── Inyectar HTML del panel ──────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `

    <!-- Overlay oscuro -->
    <div class="acc-overlay" id="accOverlay"></div>

    <!-- Panel lateral -->
    <div class="acc-panel" id="accPanel">

      <!-- Header -->
      <div class="acc-panel__head">
        <div class="acc-panel__title">G<span>&amp;</span>M</div>
        <button class="acc-panel__close" id="accClose" aria-label="Cerrar panel">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Cuerpo (se rellena dinámicamente) -->
      <div class="acc-panel__body" id="accBody"></div>

      <!-- Footer solo cuando está logueado -->
      <div class="acc-panel__footer" id="accFooter" style="display:none">
        <button class="acc-btn-logout" id="accLogout">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
        </button>
      </div>

    </div>
  `);

  // ── Referencias ──────────────────────────────────────────────
  const overlay   = document.getElementById('accOverlay');
  const panel     = document.getElementById('accPanel');
  const body      = document.getElementById('accBody');
  const footer    = document.getElementById('accFooter');
  const btnClose  = document.getElementById('accClose');
  const btnLogout = document.getElementById('accLogout');
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

  // ── Render dinámico según sesión ─────────────────────────────
  function renderPanel() {
    const raw  = sessionStorage.getItem('gmUser');
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      renderGuest();
    } else {
      renderProfile(user);
    }
  }

  // ── Estado GUEST ─────────────────────────────────────────────
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
        <p class="acc-guest__sub">Inicia sesión para acceder a tu perfil y más</p>

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

    // Al presionar, cierra el panel y abre el modal de login/registro
    document.getElementById('accGuestLogin').addEventListener('click', () => {
      closePanel();
      // Abre el modal y activa tab "login"
      openLoginModal('login');
    });
    document.getElementById('accGuestRegister').addEventListener('click', () => {
      closePanel();
      openLoginModal('registro');
    });
  }

  // Helper: abre el modal de login y activa el tab deseado
  function openLoginModal(tab) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Activar tab correcto
    document.querySelectorAll('.modal__tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.modal__form').forEach(f => f.classList.remove('active'));
    const formId = tab === 'login' ? 'formLogin' : 'formRegistro';
    document.getElementById(formId)?.classList.add('active');
  }

  // ── Estado PERFIL ────────────────────────────────────────────
  function renderProfile(user) {
    footer.style.display = 'block';

    const inicial  = (user.nombre || 'U').charAt(0).toUpperCase();
    const avatarSrc = user.avatarUrl || localStorage.getItem(`gm_avatar_${user.id}`);
    const rolLabel  = user.rol === 'admin' ? 'Administrador' : 'Cliente';

    const avatarHTML = avatarSrc
      ? `<img class="acc-avatar" src="${avatarSrc}" alt="Avatar" id="accAvatarImg">`
      : `<div class="acc-avatar-initial" id="accAvatarImg">${inicial}</div>`;

    body.innerHTML = `
      <div class="acc-profile">

        <!-- Hero / avatar -->
        <div class="acc-profile__hero">
          <div class="acc-avatar-wrap" id="accAvatarWrap" title="Cambiar foto">
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

        <!-- Status de upload -->
        <div class="acc-upload-status" id="accUploadStatus"></div>

        <!-- Info -->
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

        <!-- Próximamente -->
        <div class="acc-coming-soon">
          <div class="acc-coming-soon__icons">
            <i class="fa-regular fa-heart"></i>
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="acc-coming-soon__label">Próximamente</div>
          <div class="acc-coming-soon__text">Favoritos y lista de deseos</div>
        </div>

      </div>`;

    // Subir avatar
    const avatarWrap  = document.getElementById('accAvatarWrap');
    const avatarInput = document.getElementById('accAvatarInput');

    avatarWrap.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (file) handleAvatarUpload(file, user);
    });
  }

  // ── Subir imagen al backend ──────────────────────────────────
  async function handleAvatarUpload(file, user) {
    const status = document.getElementById('accUploadStatus');

    // Validar tipo y tamaño (max 3MB)
    if (!file.type.startsWith('image/')) {
      showStatus(status, 'error', 'Solo se permiten imágenes.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showStatus(status, 'error', 'La imagen no debe superar 3MB.');
      return;
    }

    showStatus(status, 'loading', '<span class="acc-loader"></span> Subiendo imagen…');

    try {
      // Preview inmediato mientras sube
      const localUrl = URL.createObjectURL(file);
      updateNavbarAvatar(localUrl, user);

      // Construir FormData para el backend
      const formData = new FormData();
      formData.append('file',      file);
      formData.append('usuarioId', user.id);
      formData.append('tipo',      'perfil');

      const res = await fetch(`${API_IMAGENES}/upload`, {
        method: 'POST',
        body:   formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const url  = data.url || data.secure_url || data.imageUrl || localUrl;

      // Guardar en sessionStorage y localStorage
      user.avatarUrl = url;
      sessionStorage.setItem('gmUser', JSON.stringify(user));
      localStorage.setItem(`gm_avatar_${user.id}`, url);

      // Actualizar avatar en el panel y navbar
      const avatarEl = document.getElementById('accAvatarImg');
      if (avatarEl) {
        if (avatarEl.tagName === 'IMG') {
          avatarEl.src = url;
        } else {
          // Era un div con inicial, reemplazar por img
          avatarEl.outerHTML = `<img class="acc-avatar" src="${url}" alt="Avatar" id="accAvatarImg">`;
        }
      }
      updateNavbarAvatar(url, user);

      showStatus(status, 'success', '<i class="fa-solid fa-check"></i> Foto actualizada');
      setTimeout(() => { status.style.display = 'none'; }, 3000);

    } catch {
      showStatus(status, 'error', 'Error al subir la imagen. Intenta de nuevo.');
    }
  }

  function showStatus(el, type, html) {
    el.className = `acc-upload-status ${type}`;
    el.innerHTML = html;
  }

  // ── Actualizar ícono del navbar ──────────────────────────────
  function updateNavbarAvatar(url, user) {
    const btn = document.getElementById('btnAccount');
    if (!btn) return;
    const inicial = (user.nombre || 'U').charAt(0).toUpperCase();

    // Quitar ícono fa original y span "Account", poner avatar
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');

    if (url) {
      if (icon) icon.replaceWith(Object.assign(document.createElement('img'), {
        src: url,
        alt: inicial,
        className: 'acc-nav-avatar'
      }));
    } else {
      if (icon) {
        icon.replaceWith(Object.assign(document.createElement('span'), {
          className: 'acc-nav-initial',
          textContent: inicial
        }));
      }
    }
    if (span) span.textContent = user.nombre?.split(' ')[0] || 'Perfil';
  }

  // ── Cerrar sesión ────────────────────────────────────────────
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('gmUser');
    closePanel();

    // Restaurar botón navbar
    const btn = document.getElementById('btnAccount');
    if (btn) {
      const avatarOrInitial = btn.querySelector('.acc-nav-avatar, .acc-nav-initial');
      const span = btn.querySelector('span');
      if (avatarOrInitial) {
        avatarOrInitial.replaceWith(Object.assign(document.createElement('i'), {
          className: 'fa-regular fa-user'
        }));
      }
      if (span) span.textContent = 'Account';
    }

    // Redirigir al home
    window.location.href = location.origin + '/guiselmode/index.html';
  });

  // ── Init: si ya hay sesión, actualizar navbar ────────────────
  (function initNavbar() {
    const raw = sessionStorage.getItem('gmUser');
    if (!raw) return;
    const user = JSON.parse(raw);
    const url  = user.avatarUrl || localStorage.getItem(`gm_avatar_${user.id}`);
    updateNavbarAvatar(url || null, user);
  })();

});