// config.js
const WHATSAPP_BASE = "https://wa.me/949626583?text=";
const URL_BASE_MODELO =
  "https://bloodcmen-droid.github.io/HTML/Productos.html#";

let lastScroll = 0;
const navbar = document.querySelector(".navbar-hm");
const menu = document.getElementById("menuPrincipal");

window.addEventListener("scroll", () => {
  // 🔒 Si el menú móvil está abierto, NO ocultar el navbar
  if (menu.classList.contains("show")) return;

  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    navbar.classList.remove("nav-hidden");
    lastScroll = currentScroll;
    return;
  }

  if (currentScroll > lastScroll && currentScroll > 80) {
    // ⬇️ scroll hacia abajo
    navbar.classList.add("nav-hidden");
  } else if (currentScroll < lastScroll) {
    // ⬆️ scroll hacia arriba
    navbar.classList.remove("nav-hidden");
  }

  lastScroll = currentScroll;
});



