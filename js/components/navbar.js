document.addEventListener('DOMContentLoaded', function () {

  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  // ── SCROLL EFFECT ──
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ── HAMBURGER / MENÚ MÓVIL ──
  if (hamburger && navMenu) {

    function openMenu() {
      navMenu.classList.add('open');
      hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Cierra al tocar fuera del menú
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
  }

  // ── BUSCADOR ──
  const btnSearch     = document.querySelector('[title="Buscar"]');
  const searchBar     = document.getElementById('searchBar');
  const searchInput   = document.getElementById('searchInput');
  const searchClose   = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');

  if (btnSearch && searchBar && searchInput && searchResults) {

    function closeSearch() {
      searchBar.classList.remove('open');
      searchInput.value = '';
      searchResults.innerHTML = '';
    }

    async function openSearch() {
      searchBar.classList.add('open');
      searchInput.focus();
      if (!window.allProductos?.length) {
        try {
          const res   = await fetch('https://catalogo-gym-backend-production.up.railway.app/api/productos');
          const prods = await res.json();
          await Promise.all(prods.map(async p => {
            try {
              const iRes = await fetch(`https://catalogo-gym-backend-production.up.railway.app/api/imagenes/producto/${p.id}/principal`);
              if (iRes.ok) p._imgPrinc = await iRes.json();
            } catch {}
          }));
          window.allProductos = prods;
        } catch {
          console.warn('No se pudo cargar productos para el buscador.');
        }
      }
    }

    btnSearch.addEventListener('click', () => {
      searchBar.classList.contains('open') ? closeSearch() : openSearch();
    });

    searchClose?.addEventListener('click', closeSearch);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSearch();
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.innerHTML = ''; return; }

      const productos = window.allProductos || [];

      if (!productos.length) {
        searchResults.innerHTML = `
          <div class="search-empty">
            <i class="fa-solid fa-shirt"></i>
            Ve a <a href="/guiselmode/html/productos.html" style="color:var(--accent-red)">Productos</a> para buscar desde el catálogo.
          </div>`;
        return;
      }

      const encontrados = productos.filter(p =>
        p.titulo?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.categoria?.nombre?.toLowerCase().includes(q)
      );

      if (!encontrados.length) {
        searchResults.innerHTML = `
          <div class="search-empty">
            <i class="fa-solid fa-magnifying-glass"></i>
            No se encontraron productos para "<strong>${q}</strong>"
          </div>`;
        return;
      }

      const CATEGORIA_MAP = window.CATEGORIA_MAP || {};

      searchResults.innerHTML = encontrados.map(p => {
        const img    = p._imgPrinc?.url
          ? p._imgPrinc.url.replace('/upload/', '/upload/w_100,h_100,c_fill,g_auto,f_webp,q_auto/')
          : 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&q=60';
        const precio = `S/ ${parseFloat(p.precioUnidad || 0).toFixed(2)}`;
        const gridId = CATEGORIA_MAP[p.categoria?.codigo] || '';
        return `
          <div class="search-result-card" onclick="window.irAProducto?.('${gridId}', ${p.id})">
            <img src="${img}" alt="${p.titulo}" />
            <div class="search-result-card__info">
              <div class="search-result-card__title">${p.titulo}</div>
              <div class="search-result-card__cat">${p.categoria?.nombre || ''}</div>
              <div class="search-result-card__price">${precio}</div>
            </div>
          </div>`;
      }).join('');
    });
  }

});
