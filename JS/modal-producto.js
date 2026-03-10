/* ══════════════════════════════════════════════════
   MODAL PRODUCTO CON CARRUSEL
   Pegar al FINAL de productos.js
   (dentro del DOMContentLoaded, antes del último } )
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
// ── Inyectar HTML del modal ──────────────────────
document.body.insertAdjacentHTML('beforeend', `
  <div class="prod-modal-overlay" id="prodModalOverlay">
    <div class="prod-modal" id="prodModal">

      <button class="prod-modal__close" id="prodModalClose">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <!-- CARRUSEL -->
      <div class="prod-modal__carousel" id="prodCarousel">
        <div class="carousel__track" id="carouselTrack"></div>
        <button class="carousel__btn carousel__btn--prev" id="carouselPrev">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button class="carousel__btn carousel__btn--next" id="carouselNext">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <div class="carousel__dots" id="carouselDots"></div>
        <span class="carousel__counter" id="carouselCounter">1 / 1</span>
      </div>

      <!-- INFO -->
      <div class="prod-modal__info" id="prodModalInfo">
        <!-- se llena dinámicamente -->
      </div>

    </div>
  </div>
`);

// ── Estado del carrusel ──────────────────────────
let _carouselIdx   = 0;
let _carouselTotal = 0;

function carouselGoTo(idx) {
  const track  = document.getElementById('carouselTrack');
  const dots   = document.getElementById('carouselDots');
  const counter = document.getElementById('carouselCounter');
  if (!track) return;

  _carouselIdx = Math.max(0, Math.min(idx, _carouselTotal - 1));
  track.style.transform = `translateX(-${_carouselIdx * 100}%)`;

  dots.querySelectorAll('.carousel__dot').forEach((d, i) =>
    d.classList.toggle('active', i === _carouselIdx)
  );
  counter.textContent = `${_carouselIdx + 1} / ${_carouselTotal}`;
}

document.getElementById('carouselPrev').addEventListener('click', () =>
  carouselGoTo(_carouselIdx > 0 ? _carouselIdx - 1 : _carouselTotal - 1)
);
document.getElementById('carouselNext').addEventListener('click', () =>
  carouselGoTo(_carouselIdx < _carouselTotal - 1 ? _carouselIdx + 1 : 0)
);

// Swipe touch
let _touchStartX = 0;
document.getElementById('prodCarousel').addEventListener('touchstart', e => {
  _touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById('prodCarousel').addEventListener('touchend', e => {
  const diff = _touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) carouselGoTo(diff > 0 ? _carouselIdx + 1 : _carouselIdx - 1);
});

// ── Abrir modal ──────────────────────────────────
async function abrirModalProducto(productoId) {
  const overlay = document.getElementById('prodModalOverlay');
  const track   = document.getElementById('carouselTrack');
  const dots    = document.getElementById('carouselDots');
  const info    = document.getElementById('prodModalInfo');

  // Mostrar overlay con loader
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  track.innerHTML  = `<div class="carousel__empty"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
  dots.innerHTML   = '';
  info.innerHTML   = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:2rem"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

  try {
    // Traer producto e imágenes en paralelo
    const [pRes, iRes, tRes] = await Promise.all([
      fetch(`https://catalogo-gym-backend-production.up.railway.app/api/productos/${productoId}`),
      fetch(`https://catalogo-gym-backend-production.up.railway.app/api/imagenes/producto/${productoId}`),
      fetch(`https://catalogo-gym-backend-production.up.railway.app/api/producto-tallas/producto/${productoId}`)
    ]);

    const producto = await pRes.json();
    const imagenes = iRes.ok ? await iRes.json() : [];
    const tallas   = tRes.ok ? await tRes.json() : [];

    // ── Carrusel ────────────────────────────────
    _carouselTotal = imagenes.length;
    _carouselIdx   = 0;

    if (imagenes.length === 0) {
      track.innerHTML = `<div class="carousel__empty"><i class="fa-regular fa-image"></i></div>`;
      dots.innerHTML  = '';
      document.getElementById('carouselCounter').textContent = '0 / 0';
      document.getElementById('carouselPrev').style.display = 'none';
      document.getElementById('carouselNext').style.display = 'none';
    } else {
      document.getElementById('carouselPrev').style.display = '';
      document.getElementById('carouselNext').style.display = '';

      track.innerHTML = imagenes.map(img => {
        const url = img.url.replace('/upload/', '/upload/w_800,h_900,c_fill,g_auto,f_webp,q_auto/');
        return `
          <div class="carousel__slide">
            <img src="${url}" alt="${producto.titulo}" loading="lazy" />
          </div>`;
      }).join('');

      dots.innerHTML = imagenes.map((_, i) =>
        `<button class="carousel__dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`
      ).join('');

      dots.querySelectorAll('.carousel__dot').forEach(d =>
        d.addEventListener('click', () => carouselGoTo(parseInt(d.dataset.i)))
      );

      document.getElementById('carouselCounter').textContent = `1 / ${imagenes.length}`;
      track.style.transform = 'translateX(0)';
    }

    // ── Info ─────────────────────────────────────
    const precioUnidad = `S/ ${parseFloat(producto.precioUnidad || producto.precio_unidad || 0).toFixed(2)}`;
    const precioTotal  = (producto.precioTotal || producto.precio_total)
      ? `S/ ${parseFloat(producto.precioTotal || producto.precio_total).toFixed(2)}`
      : null;

    const tallasHTML = tallas.length
      ? tallas.map(t => `<span class="prod-modal__talla">${t.talla?.nombre || ''}</span>`).join('')
      : '';

    const whatsappMsg = encodeURIComponent(`Hola! Me interesa: ${producto.titulo}`);
    const whatsappLink = `https://wa.me/949626583?text=${whatsappMsg}`;

    // Like temporal (sessionStorage)
    const likedKey   = `gm_like_${productoId}`;
    const isLiked    = sessionStorage.getItem(likedKey) === '1';

    info.innerHTML = `
      <p class="prod-modal__cat">${producto.categoria?.nombre || ''}</p>
      <h2 class="prod-modal__title">${producto.titulo}</h2>
      <div class="prod-modal__divider"></div>

      ${producto.descripcion
        ? `<p class="prod-modal__desc">${producto.descripcion}</p>`
        : ''}

      ${producto.adicional
        ? `<div class="prod-modal__adicional">${producto.adicional}</div>`
        : ''}

      ${tallasHTML ? `
        <p class="prod-modal__tallas-label">Tallas disponibles</p>
        <div class="prod-modal__tallas">${tallasHTML}</div>
      ` : ''}

      <div class="prod-modal__precios">
        <div class="prod-modal__precio-item">
          <span class="prod-modal__precio-label">Unidad</span>
          <span class="prod-modal__precio-val">${precioUnidad}</span>
        </div>
        ${precioTotal ? `
          <div class="prod-modal__precio-div"></div>
          <div class="prod-modal__precio-item">
            <span class="prod-modal__precio-label">Conjunto</span>
            <span class="prod-modal__precio-val prod-modal__precio-val--red">${precioTotal}</span>
          </div>` : ''}
      </div>

      <div class="prod-modal__actions">
        <a href="${whatsappLink}" target="_blank" class="prod-modal__btn-pedir">
          <i class="fa-brands fa-whatsapp"></i> Pedir ahora
        </a>
        <button class="prod-modal__btn-like ${isLiked ? 'liked' : ''}" id="btnModalLike" data-id="${productoId}">
          <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>
    `;

    // Like toggle (temporal por sesión)
    document.getElementById('btnModalLike').addEventListener('click', function() {
      const key    = `gm_like_${this.dataset.id}`;
      const active = sessionStorage.getItem(key) === '1';
      if (active) {
        sessionStorage.removeItem(key);
        this.classList.remove('liked');
        this.innerHTML = '<i class="fa-regular fa-heart"></i>';
      } else {
        sessionStorage.setItem(key, '1');
        this.classList.add('liked');
        this.innerHTML = '<i class="fa-solid fa-heart"></i>';
      }
    });

  } catch (err) {
    console.error('Error abriendo modal:', err);
    info.innerHTML = `<p style="color:var(--accent-red);padding:20px">Error al cargar el producto.</p>`;
  }
}

// ── Cerrar modal ─────────────────────────────────
function cerrarModalProducto() {
  const overlay = document.getElementById('prodModalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('prodModalClose').addEventListener('click', cerrarModalProducto);
document.getElementById('prodModalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('prodModalOverlay')) cerrarModalProducto();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModalProducto();
});

// ── Exponer globalmente ──────────────────────────
window.abrirModalProducto = abrirModalProducto;

});