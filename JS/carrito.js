/* ══════════════════════════════════════════════════
   CARRITO — carrito.js
   Incluir en productos.html, carrito.html y modal-producto.js
   Siempre cargar ANTES de modal-producto.js
══════════════════════════════════════════════════ */

const CARRITO_KEY = 'gm_carrito';
const WHATSAPP_NUM = '949626583';

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

// ── Init badge al cargar ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carritoBadgeUpdate();
});

// ── Exponer globalmente ──────────────────────────
window.carritoAdd    = carritoAdd;
window.carritoRemove = carritoRemove;
window.carritoClear  = carritoClear;
window.carritoGet    = carritoGet;
window.carritoIsAdded = carritoIsAdded;
window.carritoBadgeUpdate = carritoBadgeUpdate;