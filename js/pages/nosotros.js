/* ═══════════════════════════════════════════
   NOSOTROS.JS — js/pages/nosotros.js
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  const API_COMMENTS = 'https://catalogo-gym-backend.onrender.com/api/comentarios';
  let selectedStars = 0;
  let currentUser   = null;

  /* ── Verificar sesión ── */
  function checkSession() {
    const raw = sessionStorage.getItem('gmUser');
    currentUser = raw ? JSON.parse(raw) : null;
    const notice   = document.getElementById('nosLoginNotice');
    const formReal = document.getElementById('nosFormReal');
    if (!currentUser) {
      notice.style.display   = 'flex';
      formReal.style.display = 'none';
    } else {
      notice.style.display   = 'none';
      formReal.style.display = 'block';
    }
  }

  /* ── Abrir login desde aviso ── */
  document.getElementById('nosLoginLink').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('navLoginBtn')?.click();
  });

  /* ── Estrellas ── */
  document.querySelectorAll('.nos-star').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStars = parseInt(btn.dataset.val);
      document.querySelectorAll('.nos-star').forEach((s, i) => {
        s.classList.toggle('active', i < selectedStars);
      });
    });
    btn.addEventListener('mouseenter', () => {
      const val = parseInt(btn.dataset.val);
      document.querySelectorAll('.nos-star').forEach((s, i) => {
        s.style.color = i < val ? '#f59e0b' : '';
      });
    });
    btn.addEventListener('mouseleave', () => {
      document.querySelectorAll('.nos-star').forEach((s, i) => {
        s.style.color = i < selectedStars ? '#f59e0b' : '';
      });
    });
  });

  /* ── Cargar comentarios ── */
  async function cargarComentarios() {
    const list = document.getElementById('nosCommentsList');
    try {
      const res  = await fetch(API_COMMENTS);
      const data = await res.json();

      if (!data.length) {
        list.innerHTML = `
          <div class="nos-comments__empty">
            <i class="fa-regular fa-comment-dots"></i>
            Aún no hay reseñas. ¡Sé la primera en opinar!
          </div>`;
        return;
      }

      list.innerHTML = data.map(c => {
        const nombre    = c.usuario?.nombre || 'Usuario';
        const inicial   = nombre.charAt(0).toUpperCase();
        const estrellas = '★'.repeat(c.estrellas || 0) + '☆'.repeat(5 - (c.estrellas || 0));
        const fecha     = new Date(c.fecha).toLocaleDateString('es-PE', {
          day: '2-digit', month: 'long', year: 'numeric'
        });

        // Botones según rol
        const esAdmin   = currentUser?.rol === 'admin';
        const esPropio  = currentUser?.id === c.usuario?.id;

        const botonesHTML = esAdmin ? `
          <button onclick="responderComentario(${c.id})"
            style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8rem;transition:color .2s"
            onmouseover="this.style.color='var(--accent-red)'"
            onmouseout="this.style.color='var(--text-muted)'"
            title="Responder como G&M">
            <i class="fa-solid fa-reply"></i>
          </button>
          <button onclick="borrarComentario(${c.id})"
            style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8rem;transition:color .2s"
            onmouseover="this.style.color='#ef4444'"
            onmouseout="this.style.color='var(--text-muted)'"
            title="Eliminar (admin)">
            <i class="fa-solid fa-trash"></i>
          </button>`
        : esPropio ? `
          <button onclick="borrarComentario(${c.id})"
            style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8rem;transition:color .2s"
            onmouseover="this.style.color='#ef4444'"
            onmouseout="this.style.color='var(--text-muted)'"
            title="Eliminar mi reseña">
            <i class="fa-solid fa-trash"></i>
          </button>`
        : '';

        return `
          <div class="nos-comment-card" data-id="${c.id}">
            <div class="nos-comment-card__header">
              <div class="nos-comment-card__avatar">${inicial}</div>
              <div class="nos-comment-card__info">
                <div class="nos-comment-card__name">${nombre}</div>
                <div class="nos-comment-card__date">${fecha}</div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="nos-comment-card__stars">${estrellas}</div>
                ${botonesHTML}
              </div>
            </div>
            <p class="nos-comment-card__text">${c.contenido}</p>
            ${c.respuestaAdmin ? `
              <div style="margin-top:14px; padding:14px 16px; background:rgba(224,28,28,.06); border-left:2px solid var(--accent-red);">
                <p style="font-size:.75rem; font-weight:600; color:var(--accent-red); letter-spacing:.1em; margin-bottom:6px;">
                  <i class="fa-solid fa-store"></i> G&M RESPONDE
                </p>
                <p style="font-size:.85rem; color:var(--text-secondary); line-height:1.7;">${c.respuestaAdmin}</p>
              </div>` : ''}
          </div>`;
      }).join('');

    } catch {
      list.innerHTML = `
        <div class="nos-comments__empty">
          <i class="fa-solid fa-circle-exclamation"></i>
          Error al cargar reseñas.
        </div>`;
    }
  }

  /* ── Enviar comentario ── */
  document.getElementById('nosCommentSubmit').addEventListener('click', async () => {
    const texto = document.getElementById('nosCommentText').value.trim();
    if (!texto)         { alert('Escribe tu reseña antes de publicar.'); return; }
    if (!selectedStars) { alert('Selecciona una puntuación de 1 a 5 estrellas.'); return; }

    const btn = document.getElementById('nosCommentSubmit');
    btn.disabled = true;
    btn.innerHTML = '<span class="nos-loader"></span> Publicando…';

    try {
      const res = await fetch(API_COMMENTS, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido: texto,
          estrellas: selectedStars,
          usuario:   { id: currentUser.id }
        })
      });
      if (!res.ok) throw new Error();

      document.getElementById('nosCommentText').value = '';
      selectedStars = 0;
      document.querySelectorAll('.nos-star').forEach(s => {
        s.classList.remove('active');
        s.style.color = '';
      });
      await cargarComentarios();

    } catch {
      alert('Error al publicar. Intenta de nuevo.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publicar reseña';
    }
  });

  /* ── Borrar comentario ── */
  let deleteCommentId = null;

window.borrarComentario = function(id) {
  deleteCommentId = id;
  document.getElementById('nosConfirmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

document.getElementById('nosConfirmClose').addEventListener('click', () => {
  deleteCommentId = null;
  document.getElementById('nosConfirmOverlay').classList.remove('open');
  document.body.style.overflow = '';
});

document.getElementById('nosConfirmCancel').addEventListener('click', () => {
  deleteCommentId = null;
  document.getElementById('nosConfirmOverlay').classList.remove('open');
  document.body.style.overflow = '';
});

document.getElementById('nosConfirmDelete').addEventListener('click', async () => {
  if (!deleteCommentId) return;
  const btn = document.getElementById('nosConfirmDelete');
  btn.disabled = true;
  btn.innerHTML = '<span class="nos-loader"></span> Eliminando…';
  try {
    await fetch(`${API_COMMENTS}/${deleteCommentId}`, { method: 'DELETE' });
    document.getElementById('nosConfirmOverlay').classList.remove('open');
    document.body.style.overflow = '';
    deleteCommentId = null;
    await cargarComentarios();
  } catch {
    alert('Error al eliminar.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, eliminar';
  }
});

  /* ── Responder comentario (solo admin) ── */
  
  window.responderComentario = function(id) {
  // Si ya hay un form abierto en esta card, lo cierra
  const card = document.querySelector(`.nos-comment-card[data-id="${id}"]`);
  const existing = card.querySelector('.nos-reply-form');
  if (existing) { existing.remove(); return; }

  // Cerrar otros forms abiertos
  document.querySelectorAll('.nos-reply-form').forEach(f => f.remove());

  // Crear form inline
  const form = document.createElement('div');
  form.className = 'nos-reply-form';
  form.innerHTML = `
    <p style="font-size:.75rem; font-weight:600; color:var(--accent-red); letter-spacing:.1em;">
      <i class="fa-solid fa-reply"></i> RESPONDER COMO G&M
    </p>
    <textarea id="replyText-${id}" placeholder="Escribe la respuesta de G&M…" maxlength="500"></textarea>
    <div class="nos-reply-form__btns">
      <button class="nos-reply-form__send" onclick="enviarRespuesta(${id})">
        <i class="fa-solid fa-paper-plane"></i> Publicar respuesta
      </button>
      <button class="nos-reply-form__cancel" onclick="this.closest('.nos-reply-form').remove()">
        Cancelar
      </button>
    </div>`;
  card.appendChild(form);
  document.getElementById(`replyText-${id}`).focus();
};

window.enviarRespuesta = async function(id) {
  const respuesta = document.getElementById(`replyText-${id}`).value.trim();
  if (!respuesta) { alert('Escribe una respuesta.'); return; }
  try {
    await fetch(`${API_COMMENTS}/${id}/respuesta`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ respuesta })
    });
    await cargarComentarios();
  } catch {
    alert('Error al responder.');
  }
};

  /* ── Init ── */
  checkSession();
  cargarComentarios();

});
