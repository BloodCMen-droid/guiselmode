document.addEventListener('DOMContentLoaded', function () {


     const usuarioGuardado = sessionStorage.getItem('gmUser');
  if (!usuarioGuardado) {
    window.location.href = location.origin + '/guiselmode/index.html';
    return;
  }
  const user = JSON.parse(usuarioGuardado);
  if (user.rol !== 'admin') {
    window.location.href = location.origin + '/guiselmode/HTML/Productos.html';
    return;
  }
  /* ══════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════ */
  const API          = 'https://catalogo-gym-backend-production.up.railway.app/api';
  const API_TALLAS   = `${API}/producto-tallas/producto`;
  const CL_CLOUD     = 'imgapi';
  const CL_PRESET    = 'gym_preset';

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

  /* ══════════════════════════════════════════
     ESTADO
  ══════════════════════════════════════════ */
  let allProductos   = [];
  let allCategorias  = [];
  let allTallas      = [];
  let uploadedImgs   = [];   // { url, public_id }
  let deleteTarget   = null;

  /* ══════════════════════════════════════════
     INYECTAR MODAL PRODUCTO + CONFIRM + TOAST
  ══════════════════════════════════════════ */
  document.body.insertAdjacentHTML('beforeend', `

    <!-- MODAL: Crear / Editar producto -->
    <div class="mant-modal-overlay" id="mantModalOverlay">
      <div class="mant-modal">
        <div class="mant-modal__header">
          <h2 class="mant-modal__title" id="mantModalTitle">NUEVO <em>PRODUCTO</em></h2>
          <button class="mant-modal__close" id="mantModalClose">✕</button>
        </div>
        <input type="hidden" id="mantEditId" />
        <div class="mant-modal__body">

          <div class="mant-form-row">
            <div class="mant-form-group">
              <label>Título *</label>
              <input type="text" id="mf-titulo" placeholder="Ej: Polo Bordado Clásico" />
            </div>
            <div class="mant-form-group">
              <label>Categoría *</label>
              <select id="mf-categoria"><option value="">Seleccionar…</option></select>
            </div>
          </div>

          <div class="mant-form-group">
            <label>Descripción</label>
            <textarea id="mf-descripcion" placeholder="Breve descripción del producto…"></textarea>
          </div>

          <div class="mant-form-group">
            <label>Adicional</label>
            <input type="text" id="mf-adicional" placeholder="Color, edición, nota extra…" />
          </div>

          <div class="mant-form-row">
            <div class="mant-form-group">
              <label>Precio unitario (S/) *</label>
              <input type="number" id="mf-precio" step="0.01" min="0" placeholder="59.90" />
            </div>
            <div class="mant-form-group">
              <label>Precio total (S/)</label>
              <input type="number" id="mf-precio-total" step="0.01" min="0" placeholder="120.00" />
            </div>
          </div>

          <div class="mant-form-group">
            <label>Tallas disponibles</label>
            <div class="mant-tallas-wrap" id="mantTallasWrap"></div>
          </div>

          <div class="mant-form-group">
            <label>Imágenes del producto</label>
            <div class="mant-upload-area">
              <input type="file" id="mf-imgs" accept="image/*" multiple />
              <div class="mant-upload-area__icon">🖼️</div>
              <p>Haz clic o arrastra imágenes aquí</p>
              <small>JPG, PNG, WEBP — puedes subir varias a la vez</small>
            </div>
            <div class="mant-upload-progress" id="mantUploadProgress"></div>
            <div class="mant-img-preview" id="mantImgPreview"></div>
          </div>

        </div>
        <div class="mant-modal__footer">
          <button class="btn-outline-mant" id="mantModalCancel">Cancelar</button>
          <button class="btn-primary" id="mantModalSave">
            <i class="fa-solid fa-floppy-disk"></i> Guardar producto
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Confirmar eliminación -->
    <div class="mant-modal-overlay" id="mantConfirmOverlay">
      <div class="mant-modal" style="max-width:460px">
        <div class="mant-modal__header">
          <h2 class="mant-modal__title">ELIMINAR <em>PRODUCTO</em></h2>
          <button class="mant-modal__close" id="mantConfirmClose">✕</button>
        </div>
        <div class="mant-confirm__msg">
          <strong id="mantConfirmTitle">¿Segura que quieres eliminar este producto?</strong>
          <span id="mantConfirmSub"></span>
          <p class="mant-confirm__warn">⚠️ Esta acción no se puede deshacer.</p>
        </div>
        <div class="mant-modal__footer">
          <button class="btn-outline-mant" id="mantConfirmCancel">Cancelar</button>
          <button class="btn-primary" id="mantConfirmDelete" style="background:var(--accent-red)">
            <i class="fa-solid fa-trash"></i> Sí, eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div class="mant-toast" id="mantToast"></div>

  `);

  /* ══════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════ */
  const $ = id => document.getElementById(id);

  function showToast(msg, type = 'ok') {
    const t = $('mantToast');
    t.textContent = msg;
    t.className = `mant-toast mant-toast--${type} show`;
    setTimeout(() => t.className = 'mant-toast', 3200);
  }

  function openModal(overlay)  {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════
     INICIALIZAR
  ══════════════════════════════════════════ */
  async function init() {
    await Promise.all([cargarCategorias(), cargarTallas()]);
    await cargarProductos();
  }

  /* ══════════════════════════════════════════
     CATEGORÍAS
  ══════════════════════════════════════════ */
  async function cargarCategorias() {
    const res = await fetch(`${API}/categorias`);
    allCategorias = await res.json();
    const sel = $('mf-categoria');
    allCategorias.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.nombre;
      sel.appendChild(o);
    });
  }

  /* ══════════════════════════════════════════
     TALLAS
  ══════════════════════════════════════════ */
  async function cargarTallas() {
    const res = await fetch(`${API}/tallas`);
    allTallas = await res.json();
  }

  function renderTallasCheckboxes(selected = []) {
    const wrap = $('mantTallasWrap');
    wrap.innerHTML = '';
    allTallas.forEach(t => {
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.className = 'mant-talla-cb';
      cb.id = `mtalla-${t.id}`; cb.value = t.id;
      if (selected.includes(t.id)) cb.checked = true;
      const lbl = document.createElement('label');
      lbl.className = 'mant-talla-lbl';
      lbl.htmlFor = `mtalla-${t.id}`;
      lbl.textContent = t.nombre;
      wrap.appendChild(cb);
      wrap.appendChild(lbl);
    });
  }

  function getTallasSeleccionadas() {
    return [...document.querySelectorAll('.mant-talla-cb:checked')].map(cb => parseInt(cb.value));
  }

  /* ══════════════════════════════════════════
     CARGAR Y RENDERIZAR PRODUCTOS
  ══════════════════════════════════════════ */
  async function cargarProductos() {
    try {
      // Limpiar grids y mostrar loader
      Object.values(CATEGORIA_MAP).forEach(gid => {
        const el = document.getElementById(gid);
        if (el) el.innerHTML = '<div class="mant-empty-cat"><span class="mant-loader"></span> Cargando…</div>';
      });

      const res = await fetch(`${API}/productos`);
      allProductos = await res.json();

      // Limpiar grids
      Object.values(CATEGORIA_MAP).forEach(gid => {
        const el = document.getElementById(gid);
        if (el) el.innerHTML = '';
      });

      // Enriquecer con tallas e imagen principal
      await Promise.all(allProductos.map(async p => {
        try {
          const [tRes, iRes] = await Promise.all([
            fetch(`${API_TALLAS}/${p.id}`),
            fetch(`${API}/imagenes/producto/${p.id}/principal`)
          ]);
          p._tallas   = tRes.ok ? await tRes.json() : [];
          p._imgPrinc = iRes.ok ? await iRes.json() : null;
        } catch {
          p._tallas = []; p._imgPrinc = null;
        }
      }));

      // Insertar cards en sus grids
      allProductos.forEach(p => {
        const codigo = p.categoria?.codigo;
        const gridId = CATEGORIA_MAP[codigo];
        if (!gridId) return;
        const grid = document.getElementById(gridId);
        if (grid) grid.insertAdjacentHTML('beforeend', crearCardAdmin(p));
      });

      // Mostrar mensaje vacío si no hay productos en algún grid
      Object.values(CATEGORIA_MAP).forEach(gid => {
        const el = document.getElementById(gid);
        if (el && el.innerHTML.trim() === '') {
          el.innerHTML = '<div class="mant-empty-cat">No hay productos en esta categoría.</div>';
        }
      });

      actualizarStats();

    } catch (err) {
      console.error('Error cargando productos:', err);
      showToast('Error al cargar productos.', 'err');
    }
  }

  function actualizarStats() {
    $('stat-total').textContent  = allProductos.length;
    $('stat-active').textContent = allProductos.filter(p => p.activo !== false).length;
    $('stat-cats').textContent   = new Set(allProductos.map(p => p.categoria?.id).filter(Boolean)).size;
  }

  /* ══════════════════════════════════════════
     CREAR CARD ADMIN
     (igual que productos.js pero con botones)
  ══════════════════════════════════════════ */
  function crearCardAdmin(p) {
    console.log('imgPrinc de', p.titulo, ':', p._imgPrinc);
    const imgUrl = p._imgPrinc
      ? optimizarUrlCloudinary(p._imgPrinc.url)
      : 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80';

    const tallasTexto = (p._tallas || []).length > 0
      ? p._tallas.map(t => t.talla?.nombre || t.nombre || '?').join(' · ')
      : null;

    const precioUnidad = `S/ ${parseFloat(p.precioUnidad || p.precio_unidad || 0).toFixed(2)}`;
    const precioTotal  = (p.precioTotal || p.precio_total)
      ? `S/ ${parseFloat(p.precioTotal || p.precio_total).toFixed(2)}`
      : null;

    return `
      <div class="product-card product-card--admin" data-id="${p.id}">

        <!-- Botones admin sobre imagen -->
        <div class="card-admin-actions">
          <button class="card-admin-btn card-admin-btn--edit"
                  title="Editar"
                  onclick="mantEditarProducto(${p.id})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="card-admin-btn card-admin-btn--delete"
                  title="Eliminar"
                  onclick="mantEliminarConfirm(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>

        <div class="product-card__img-wrap">
          <span class="product-card__badge">${p.activo !== false ? 'Activo' : 'Inactivo'}</span>
          <img src="${imgUrl}" alt="${p.titulo}" loading="lazy" />
          <div class="product-card__overlay">
            <button class="product-card__pedir"
                    style="border:none;cursor:pointer;background:var(--accent-red);color:#fff;padding:8px 18px;font-family:var(--font-body);font-size:.85rem;font-weight:600;letter-spacing:.06em"
                    onclick="mantEditarProducto(${p.id})">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
          </div>
        </div>

        <div class="product-card__body">
          <p class="product-card__category">${p.categoria?.nombre || ''}</p>
          <h3 class="product-card__name">${p.titulo}</h3>

          ${p.descripcion ? `<p class="product-card__desc">${p.descripcion}</p>` : ''}
          ${p.adicional   ? `<p class="product-card__desc">${p.adicional}</p>`   : ''}

          ${tallasTexto ? `
            <div class="product-card__dtallas">
              <span class="tallas__label">Tallas</span>
              <span class="tallas__list">${tallasTexto}</span>
            </div>` : ''}

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
            <button class="product-card__btn-pedir"
                    style="border:none;cursor:pointer;background:var(--accent-red);color:#fff"
                    onclick="mantEditarProducto(${p.id})">
              <i class="fa-solid fa-pen"></i> Editar producto
            </button>
            <button class="product-card__wishlist"
                    style="border:none;cursor:pointer;"
                    title="Eliminar"
                    onclick="mantEliminarConfirm(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash" style="color:var(--accent-red)"></i>
            </button>
          </div>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════
     FILTROS (igual que productos.js)
  ══════════════════════════════════════════ */
  document.querySelectorAll('.filtro__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.cat-section').forEach(sec => {
        sec.classList.toggle('hidden', filter !== 'all' && sec.dataset.cat !== filter);
      });
    });
  });

  /* ══════════════════════════════════════════
     MODAL PRODUCTO — ABRIR / CERRAR
  ══════════════════════════════════════════ */
  const overlay = $('mantModalOverlay');

  $('btnNuevoProducto').addEventListener('click', () => abrirCrear());
  $('mantModalClose').addEventListener('click',   () => closeModal(overlay));
  $('mantModalCancel').addEventListener('click',  () => closeModal(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });

  function abrirCrear() {
    $('mantModalTitle').innerHTML = 'NUEVO <em>PRODUCTO</em>';
    $('mantEditId').value = '';
    ['mf-titulo','mf-descripcion','mf-adicional','mf-precio','mf-precio-total'].forEach(id => $(id).value = '');
    $('mf-categoria').value = '';
    renderTallasCheckboxes();
    uploadedImgs = [];
    $('mantImgPreview').innerHTML = '';
    $('mantUploadProgress').textContent = '';
    openModal(overlay);
  }

  window.mantEditarProducto = async function(id) {
    const p = allProductos.find(x => x.id === id);
     console.log('_tallas del producto:', p._tallas); 
    if (!p) return;

    $('mantModalTitle').innerHTML = 'EDITAR <em>PRODUCTO</em>';
    $('mantEditId').value         = p.id;
    $('mf-titulo').value          = p.titulo || '';
    $('mf-descripcion').value     = p.descripcion || '';
    $('mf-adicional').value       = p.adicional || '';
    $('mf-precio').value          = p.precioUnidad   || p.precio_unidad   || '';
    $('mf-precio-total').value    = p.precioTotal     || p.precio_total    || '';
    $('mf-categoria').value       = p.categoriaId     || p.categoria?.id  || '';

    // Tallas seleccionadas
    const selIds = (p._tallas || []).map(t => t.talla?.id || t.tallaId || t.id).filter(Boolean);
    renderTallasCheckboxes(selIds);

    // Imágenes existentes
    uploadedImgs = [];
    $('mantImgPreview').innerHTML = '';
    $('mantUploadProgress').textContent = '';
    try {
      const iRes = await fetch(`${API}/imagenes/producto/${id}`);
      if (iRes.ok) {
        const imgs = await iRes.json();
        imgs.forEach(img => agregarPreview(img.url, img.publicId || img.public_id));
      }
    } catch {}

    openModal(overlay);
  };

  /* ══════════════════════════════════════════
     CLOUDINARY UPLOAD
  ══════════════════════════════════════════ */
  $('mf-imgs').addEventListener('change', async e => {
    const files = [...e.target.files];
    if (!files.length) return;

    $('mantUploadProgress').textContent = `Subiendo ${files.length} imagen(es)…`;
    let done = 0;

    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CL_PRESET);
      fd.append('folder', 'gym_products');
      try {
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CL_CLOUD}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.secure_url) {
          agregarPreview(data.secure_url, data.public_id);
          done++;
          $('mantUploadProgress').textContent = `${done}/${files.length} subida(s)…`;
        } else {
          showToast(`Error subiendo imagen: ${data.error?.message || '?'}`, 'err');
        }
      } catch {
        showToast('Error de red al subir imagen.', 'err');
      }
    }

    $('mantUploadProgress').textContent = done === files.length
      ? `✅ ${done} imagen(es) lista(s)`
      : `⚠️ ${done}/${files.length} subidas correctamente`;
    e.target.value = '';
  });

  function agregarPreview(url, publicId) {
    if (!uploadedImgs.find(i => i.public_id === publicId)) {
      uploadedImgs.push({ url, public_id: publicId });
    }
    const wrap = document.createElement('div');
    wrap.className = 'mant-img-preview__item';
    wrap.dataset.pid = publicId;
    wrap.innerHTML = `
      <img src="${url}" alt="preview" />
      <button class="mant-img-preview__remove" onclick="mantRemoveImg('${publicId}')">✕</button>`;
    $('mantImgPreview').appendChild(wrap);
  }

  window.mantRemoveImg = function(publicId) {
    uploadedImgs = uploadedImgs.filter(i => i.public_id !== publicId);
    document.querySelector(`.mant-img-preview__item[data-pid="${publicId}"]`)?.remove();
  };

  /* ══════════════════════════════════════════
     GUARDAR PRODUCTO (Crear / Editar)
  ══════════════════════════════════════════ */
  $('mantModalSave').addEventListener('click', async () => {
    const titulo = $('mf-titulo').value.trim();
    const catId  = parseInt($('mf-categoria').value);
    const precio = parseFloat($('mf-precio').value);

    if (!titulo || !catId || isNaN(precio)) {
      showToast('Completa los campos obligatorios (*).', 'err');
      return;
    }

    const body = {
      titulo,
      descripcion:  $('mf-descripcion').value.trim()     || null,
      adicional:    $('mf-adicional').value.trim()        || null,
      precioUnidad: precio,
      precioTotal:  parseFloat($('mf-precio-total').value) || null,
      categoria:  { id: catId },
      activo:       true
    };

    const editId = $('mantEditId').value;
    const isEdit = !!editId;
    const btn    = $('mantModalSave');
    btn.disabled = true;
    btn.innerHTML = '<span class="mant-loader"></span> Guardando…';

    try {
      // 1. Producto
      const pRes = await fetch(`${API}/productos${isEdit ? '/' + editId : ''}`, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });
      if (!pRes.ok) throw new Error('Error al guardar el producto.');
      const saved  = await pRes.json();
      const prodId = saved.id;

      // 2. Tallas — limpiar y reinsertar
      if (isEdit) {
        const oldPT = await (await fetch(`${API}/producto-tallas/producto/${prodId}`)).json();
        await Promise.all(oldPT.map(pt =>
          fetch(`${API}/producto-tallas/${prodId}/${pt.talla?.id || pt.tallaId}`, { method: 'DELETE' })
        ));
      }
      await Promise.all(getTallasSeleccionadas().map(tallaId =>
      fetch(`${API}/producto-tallas/simple?productoId=${prodId}&tallaId=${tallaId}`, {
      method: 'POST'
      })
      ));

      // 3. Imágenes — solo las nuevas
      if (!isEdit) {
  for (let i = 0; i < uploadedImgs.length; i++) {
    await fetch(`${API}/imagenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto:    { id: prodId },
        url:         uploadedImgs[i].url,
        publicId:    uploadedImgs[i].public_id,
        esPrincipal: i === 0,
        orden:       i + 1
      })
    });
  }
} else {
  // 1. Borrar todas las imágenes viejas
  const existingDel = await (await fetch(`${API}/imagenes/producto/${prodId}`)).json();
  await Promise.all(existingDel.map(img =>
    fetch(`${API}/imagenes/${img.id}`, { method: 'DELETE' })
  ));




  // 2. Reinsertar todas las del preview
  for (let i = 0; i < uploadedImgs.length; i++) {
    await fetch(`${API}/imagenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto:    { id: prodId },
        url:         uploadedImgs[i].url,
        publicId:    uploadedImgs[i].public_id,
        esPrincipal: i === 0,
        orden:       i + 1
      })
    });
  }
}

      showToast(isEdit ? '✅ Producto actualizado.' : '✅ Producto creado correctamente.', 'ok');
      closeModal(overlay);
      await cargarProductos();

    } catch (err) {
      showToast(err.message || 'Error inesperado.', 'err');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar producto';
    }
  });

  /* ══════════════════════════════════════════
     ELIMINAR
  ══════════════════════════════════════════ */
  const confirmOverlay = $('mantConfirmOverlay');

  window.mantEliminarConfirm = function(id, titulo) {
    deleteTarget = id;
    $('mantConfirmSub').textContent = `"${titulo}"`;
    openModal(confirmOverlay);
  };

  $('mantConfirmClose').addEventListener('click',  () => { deleteTarget = null; closeModal(confirmOverlay); });
  $('mantConfirmCancel').addEventListener('click', () => { deleteTarget = null; closeModal(confirmOverlay); });
  confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) { deleteTarget = null; closeModal(confirmOverlay); } });

  $('mantConfirmDelete').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = $('mantConfirmDelete');
    btn.disabled = true;
    btn.innerHTML = '<span class="mant-loader"></span> Eliminando…';
    try {
      const res = await fetch(`${API}/productos/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Producto eliminado.', 'ok');
      closeModal(confirmOverlay);
      deleteTarget = null;
      await cargarProductos();
    } catch {
      showToast('Error al eliminar el producto.', 'err');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash"></i> Sí, eliminar';
    }
  });

  /* ══════════════════════════════════════════
     ARRANCAR
  ══════════════════════════════════════════ */
  init();

});