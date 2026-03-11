/* ══════════════════════════════════════════════════
   CARRITO — carrito.js
   Incluir en productos.html, carrito.html y modal-producto.js
   Siempre cargar ANTES de modal-producto.js
══════════════════════════════════════════════════ */

const CARRITO_KEY  = 'gm_carrito';
const WHATSAPP_NUM = '949626583';
const API_BASE     = 'https://catalogo-gym-backend-production.up.railway.app';

// ── UTILS ────────────────────────────────────────
function carritoGet() {
  try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
  catch { return []; }
}

function carritoSave(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
  carritoBadgeUpdate();
}

function carritoAdd(producto) {
  const items = carritoGet();
  if (items.find(i => i.id === producto.id)) {
    carritoNotif('Ya está en tu carrito 🛒');
    return;
  }
  items.push(producto);
  carritoSave(items);
  carritoNotif(`✅ "${producto.titulo}" agregado al carrito`);
}

function carritoRemove(id) {
  carritoSave(carritoGet().filter(i => i.id !== id));
}

function carritoClear() {
  localStorage.removeItem(CARRITO_KEY);
  carritoBadgeUpdate();
}

// ── BADGE en navbar ──────────────────────────────
function carritoBadgeUpdate() {
  const count = carritoGet().length;
  document.querySelectorAll('.carrito-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── NOTIFICACIÓN toast ───────────────────────────
function carritoNotif(msg) {
  let toast = document.getElementById('carritoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'carritoToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 28px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--bg-card);
      border: 1px solid var(--accent-red);
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: .85rem;
      padding: 12px 24px;
      z-index: 9999;
      opacity: 0;
      transition: opacity .3s, transform .3s;
      white-space: nowrap;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);
}

// ── Verificar si producto está en carrito ────────
function carritoIsAdded(id) {
  return !!carritoGet().find(i => i.id === id);
}

// ── PEDIR — guarda en backend y manda WhatsApp ───
async function carritoPedir(onSuccess) {
  const items = carritoGet();
  if (items.length === 0) return;

  // Mostrar estado de carga en el botón
  const btn = document.getElementById('btnPedirTodo');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando pedido...';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
  }

  try {
    // POST al backend — guarda el pedido y devuelve UUID
    const res = await fetch(`${API_BASE}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });

    if (!res.ok) throw new Error('Error al guardar pedido');

    const pedido = await res.json();
    const uuid   = pedido.id;

    // Link para el dueño
    const linkDueno = `https://bloodcmen-droid.github.io/guiselmode/HTML/carrito-control.html?id=${uuid}`;

    // Mensaje WhatsApp con el link del pedido
    const titulos = items.map(p => `• ${p.titulo}`).join('\n');
    const msg = `Hola! Me interesan estos productos:\n\n${titulos}\n\n🔗 Ver mi pedido completo:\n${linkDueno}`;
    const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;

    // Vaciar carrito
    carritoClear();
    if (onSuccess) onSuccess();

    // Abrir WhatsApp
    window.open(waUrl, '_blank');

  } catch (err) {
    console.error(err);
    carritoNotif('❌ Error al enviar pedido, intentá de nuevo');

    // Restaurar botón si hay error
    if (btn) {
      btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Pedir todo por WhatsApp';
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
  }
}

// ── Init badge al cargar ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carritoBadgeUpdate();
});

// ── Exponer globalmente ──────────────────────────
window.carritoAdd         = carritoAdd;
window.carritoRemove      = carritoRemove;
window.carritoClear       = carritoClear;
window.carritoGet         = carritoGet;
window.carritoIsAdded     = carritoIsAdded;
window.carritoBadgeUpdate = carritoBadgeUpdate;
window.carritoPedir       = carritoPedir;