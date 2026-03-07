
document.addEventListener('DOMContentLoaded', function() {
(function () {

  const API = 'https://catalogo-gym-backend-production.up.railway.app/api/usuarios';

  // Insertar modal en el body
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <button class="modal__close" id="modalClose">✕</button>
        <div class="modal__tabs">
          <button class="modal__tab active" data-tab="login">Iniciar Sesión</button>
          <button class="modal__tab" data-tab="registro">Registrarse</button>
        </div>
        <form class="modal__form active" id="formLogin">
          <div><label class="modal__label">Email</label>
          <input class="modal__input" type="email" id="loginEmail" placeholder="tu@email.com" required /></div>
          <div><label class="modal__label">Contraseña</label>
          <input class="modal__input" type="password" id="loginPassword" placeholder="••••••••" required /></div>
          <div class="modal__msg" id="loginMsg"></div>
          <button class="modal__submit" type="submit">Ingresar</button>
        </form>
        <form class="modal__form" id="formRegistro">
          <div><label class="modal__label">Nombre</label>
          <input class="modal__input" type="text" id="regNombre" placeholder="Tu nombre" required /></div>
          <div><label class="modal__label">Email</label>
          <input class="modal__input" type="email" id="regEmail" placeholder="tu@email.com" required /></div>
          <div><label class="modal__label">Contraseña</label>
          <input class="modal__input" type="password" id="regPassword" placeholder="••••••••" required /></div>
          <div class="modal__msg" id="registroMsg"></div>
          <button class="modal__submit" type="submit">Crear cuenta</button>
        </form>
      </div>
    </div>
  `);

  const overlay    = document.getElementById('modalOverlay');
  const btnClose   = document.getElementById('modalClose');
  const btnAccount = document.getElementById('btnAccount');

  function openModal()  {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btnAccount.addEventListener('click', openModal);
  btnClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Tabs
  document.querySelectorAll('.modal__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal__tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.modal__form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab === 'login' ? 'formLogin' : 'formRegistro').classList.add('active');
    });
  });

  // Login
  document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('loginMsg');
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = e.target.querySelector('.modal__submit');
    btn.disabled = true;
    btn.textContent = 'Cargando...';
    try {
      const usuarios = await fetch(API).then(r => r.json());
      const user = usuarios.find(u => u.email === email && u.passwordHash === password);
if (user) {
  sessionStorage.setItem('gmUser', JSON.stringify(user)); 
  msg.className = 'modal__msg success';
  msg.textContent = `¡Bienvenido, ${user.nombre}! ✓`;
  setTimeout(() => {
    if (user.rol === 'admin') {
      window.location.href = location.origin + '/guiselmode/HTML/mantenimiento.html';
    } else {
      window.location.href = location.origin + '/guiselmode/HTML/Productos.html';
    }
      }, 1500);

      } else {
        msg.className = 'modal__msg error';
        msg.textContent = 'Email o contraseña incorrectos.';
      }
    } catch {
      msg.className = 'modal__msg error';
      msg.textContent = 'No se pudo conectar con el servidor.';
    }
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  });

  // Registro
  document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('registroMsg');
    const btn = e.target.querySelector('.modal__submit');
    btn.disabled = true;
    btn.textContent = 'Cargando...';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: document.getElementById('regNombre').value.trim(),
          email: document.getElementById('regEmail').value.trim(),
          passwordHash: document.getElementById('regPassword').value,
          activo: true
        })
      });
      if (res.ok) {
        msg.className = 'modal__msg success';
        msg.textContent = '¡Cuenta creada! ✓';
        e.target.reset();
        setTimeout(() => {
        window.location.href = location.origin + '/guiselmode/HTML/productos.html';
        }, 1500);
      } else {
        msg.className = 'modal__msg error';
        msg.textContent = 'Error al crear la cuenta.';
      }
    } catch {
      msg.className = 'modal__msg error';
      msg.textContent = 'No se pudo conectar con el servidor.';
    }
    btn.disabled = false;
    btn.textContent = 'Crear cuenta';
  });

})();
});