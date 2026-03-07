document.addEventListener('DOMContentLoaded', function () {

  const API          = 'https://catalogo-gym-backend-production.up.railway.app/api/productos';
  const API_TALLAS   = 'https://catalogo-gym-backend-production.up.railway.app/api/producto-tallas/producto';
  const WHATSAPP     = 'https://wa.me/949626583';

  let allProductos = []; 

  function optimizarUrlCloudinary(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_800,h_800,c_fill,g_auto,f_webp,q_auto/');
}

  const CATEGORIA_MAP = {
    'Ppb':  'grid-poleras-bordado',
    'Ppe':  'grid-poleras-estampado',
    'PlpB': 'grid-polos-bordado',
    'PlpE': 'grid-polos-estampado',
    'CpB':  'grid-conjuntos-bordado',
    'CpE':  'grid-conjuntos-estampado',
    'FpB':  'grid-familia-bordado',
    'FpE':  'grid-familia-estampado',
    'PjP':  'grid-pijamas',
    'PrP':  'grid-personaje',
  };

  function crearCard(producto, tallas, imgUrl= 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80') {
    const precioUnidad = `S/ ${parseFloat(producto.precioUnidad).toFixed(2)}`;
    const precioTotal  = producto.precioTotal
      ? `S/ ${parseFloat(producto.precioTotal).toFixed(2)}`
      : null;

    const tallasTexto = tallas.length > 0
      ? tallas.map(t => t.talla.nombre).join(' · ')
      : null;

    const msg  = encodeURIComponent(`Hola! Me interesa: ${producto.titulo}`);
    const link = `${WHATSAPP}?text=${msg}`;

    return `
      <div class="product-card">
        <div class="product-card__img-wrap">
          <span class="product-card__badge">Nuevo</span>
          <img src="${imgUrl}"
               alt="${producto.titulo}" loading="lazy" />
          <div class="product-card__overlay">
            <a href="${link}" target="_blank" class="product-card__pedir">
              <i class="fa-brands fa-whatsapp"></i> Pedir
            </a>
          </div>
        </div>
        <div class="product-card__body">

          <p class="product-card__category">${producto.categoria?.nombre || ''}</p>
          <h3 class="product-card__name">${producto.titulo}</h3>

          ${producto.descripcion
            ? `<p class="product-card__desc">${producto.descripcion}</p>`
            : ''}

          ${tallasTexto
            ? `<div class="product-card__tallas">
                <span class="tallas__label">Tallas</span>
                <span class="tallas__list">${tallasTexto}</span>
               </div>`
            : ''}

          <div class="product-card__precios">
            <div class="precio-item">
              <span class="precio-label">Unidad</span>
              <span class="precio-valor">${precioUnidad}</span>
            </div>
            ${precioTotal ? `
            <div class="precio-divider"></div>
            <div class="precio-item">
              <span class="precio-label">Conjunto</span>
              <span class="precio-valor precio-valor--total">${precioTotal}</span>
            </div>` : ''}
          </div>

          <div class="product-card__footer">
            <a href="${link}" target="_blank" class="product-card__btn-pedir">
              <i class="fa-brands fa-whatsapp"></i> Pedir ahora
            </a>
            <button class="product-card__wishlist" title="Favorito">
              <i class="fa-regular fa-heart"></i>
            </button>
          </div>

        </div>
      </div>
    `;
  }

 async function cargarProductos() {
    try {
      const res       = await fetch(API);
      const productos = await res.json();
      allProductos    = productos; // ← AGREGAR ESTO

      Object.values(CATEGORIA_MAP).forEach(gridId => {
        const el = document.getElementById(gridId);
        if (el) el.innerHTML = '';
      });

      await Promise.all(productos.map(async (p) => {
        const codigo = p.categoria?.codigo;
        const gridId = CATEGORIA_MAP[codigo];
        if (!gridId) return;

        let tallas = [];
        let imgUrl = 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80';
        try {
          const [resTallas, resImg] = await Promise.all([
            fetch(`${API_TALLAS}/${p.id}`),
            fetch(`https://catalogo-gym-backend-production.up.railway.app/api/imagenes/producto/${p.id}/principal`)
          ]);
          tallas = resTallas.ok ? await resTallas.json() : [];
          if (resImg.ok) {
            const img = await resImg.json();
            if (img?.url) {
              imgUrl = optimizarUrlCloudinary(img.url);
              p._imgPrinc = img; // ← AGREGAR para el buscador
            }
          }
        } catch {}

        const grid = document.getElementById(gridId);
        if (grid) grid.insertAdjacentHTML('beforeend', crearCard(p, tallas, imgUrl));
      }));

      window.allProductos  = allProductos;  // ← al final
      window.CATEGORIA_MAP = CATEGORIA_MAP; // ← al final

    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  }
  cargarProductos();

  // Filtros
  const btnsFiltro = document.querySelectorAll('.filtro__btn');
  btnsFiltro.forEach(btn => {
    btn.addEventListener('click', () => {
      btnsFiltro.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.cat-section').forEach(sec => {
        sec.classList.toggle('hidden', filter !== 'all' && sec.dataset.cat !== filter);
      });
    });
  });


  // Exponer datos para el buscador
  window.allProductos  = allProductos;
  window.CATEGORIA_MAP = CATEGORIA_MAP;

  window.irAProducto = function(gridId, productoId) {
    // Cerrar buscador
    document.getElementById('searchBar')?.classList.remove('open');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';

    // Scroll a la sección
    if (gridId) {
      const el = document.getElementById(gridId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Highlight la card
    setTimeout(() => {
      const card = document.querySelector(`.product-card[data-id="${productoId}"]`);
      if (card) {
        card.style.outline = '2px solid var(--accent-red)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => card.style.outline = '', 2000);
      }
    }, 500);
  };

});
