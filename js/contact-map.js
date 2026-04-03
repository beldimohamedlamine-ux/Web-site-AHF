/**
 * Carte contact — épingle + étiquette (tag) fixée sous la pointe, style vitrine.
 */
(function () {
  function telHrefFromDisplay(display) {
    var d = String(display || "").replace(/[^\d+]/g, "");
    return d || "+213661467003";
  }

  function pinSvg() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" aria-hidden="true" focusable="false">' +
      '<path fill="#1e1e1e" stroke="rgba(255,255,255,0.4)" stroke-width="1" d="M18 1C9.8 1 3.2 7.6 3.2 15.8c0 10.2 12.4 22.6 13.9 24.1.5.5 1.1.8 1.9.8s1.4-.3 1.9-.8C22.4 38.4 34.8 26 34.8 15.8 34.8 7.6 28.2 1 18 1"/>' +
      '<circle cx="18" cy="14" r="5.5" fill="rgba(180,210,232,0.95)"/>' +
      "</svg>"
    );
  }

  function buildMarkerElement(config) {
    var root = document.createElement("div");
    root.className = "contact-map-marker-root";

    var pin = document.createElement("div");
    pin.className = "contact-map-marker-pin";
    pin.innerHTML = pinSvg();
    pin.setAttribute("role", "button");
    pin.setAttribute("tabindex", "0");
    pin.setAttribute("aria-label", config.pinLabel || "Localisation");

    var tag = document.createElement("div");
    tag.className = "contact-map-tag";
    tag.setAttribute("role", "dialog");
    if (config.popupDir) tag.setAttribute("dir", config.popupDir);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "contact-map-tag-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", config.closeLabel || "Fermer");

    var title = document.createElement("strong");
    title.className = "contact-map-tag-title";
    title.textContent = config.title || "RIMES FOODS";

    tag.appendChild(closeBtn);
    tag.appendChild(title);

    if (config.address) {
      var addr = document.createElement("p");
      addr.className = "contact-map-tag-addr";
      addr.textContent = config.address;
      tag.appendChild(addr);
    }

    var phoneP = document.createElement("p");
    phoneP.className = "contact-map-tag-phone";
    var label = document.createElement("span");
    label.className = "contact-map-tag-phone-label";
    label.textContent = config.phoneLabel || "";
    phoneP.appendChild(label);
    phoneP.appendChild(document.createTextNode(" "));
    var link = document.createElement("a");
    link.href = "tel:" + telHrefFromDisplay(config.phone);
    link.textContent = config.phone || "";
    phoneP.appendChild(link);
    tag.appendChild(phoneP);

    function hideTag(e) {
      if (e) e.stopPropagation();
      tag.setAttribute("hidden", "");
    }

    function showTag(e) {
      if (e) e.stopPropagation();
      tag.removeAttribute("hidden");
    }

    closeBtn.addEventListener("click", hideTag);
    pin.addEventListener("click", showTag);
    pin.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showTag(e);
      }
    });
    tag.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    root.appendChild(pin);
    root.appendChild(tag);

    return root;
  }

  function init() {
    var el = document.getElementById("contact-map-canvas");
    if (!el || typeof L === "undefined") return;

    var lat = parseFloat(el.getAttribute("data-lat"));
    var lng = parseFloat(el.getAttribute("data-lng"));
    var zoom = parseInt(el.getAttribute("data-zoom") || "15", 10);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    var markerEl = buildMarkerElement({
      title: el.getAttribute("data-title"),
      address: el.getAttribute("data-address"),
      phoneLabel: el.getAttribute("data-phone-label"),
      phone: el.getAttribute("data-phone"),
      popupDir: el.getAttribute("data-popup-dir") || "",
      closeLabel: el.getAttribute("data-close-label"),
      pinLabel: el.getAttribute("data-pin-label"),
    });

    var icon = L.divIcon({
      className: "contact-map-divicon",
      html: markerEl,
      iconSize: [280, 168],
      iconAnchor: [140, 46],
    });

    L.marker([lat, lng], { icon: icon }).addTo(map);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
