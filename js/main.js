(function () {
  function syncHeaderOffset() {
    var header = document.querySelector(".site-header");
    if (header) {
      document.documentElement.style.setProperty("--header-offset", header.offsetHeight + "px");
    }
  }

  syncHeaderOffset();
  window.addEventListener("resize", syncHeaderOffset);
  window.addEventListener("load", syncHeaderOffset);

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });
})();
