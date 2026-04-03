(function () {
  /** Envoi vers la boîte cabinet via Formspree (https://formspree.io). */
  var AHF_FORM_SUBMIT_AJAX = "https://formspree.io/f/xwvwqbjn";

  function formSubmitMessages(lang) {
    var L = {
      fr: {
        ok: "Votre message a été envoyé. Nous vous répondrons dès que possible.",
        err: "L’envoi a échoué. Réessayez plus tard ou contactez-nous par téléphone.",
        net: "Problème de connexion. Vérifiez le réseau et réessayez.",
        wait: "Envoi en cours…",
      },
      en: {
        ok: "Your message was sent. We will get back to you as soon as we can.",
        err: "Sending failed. Please try again later or call us.",
        net: "Connection issue. Check your network and try again.",
        wait: "Sending…",
      },
      ar: {
        ok: "تم إرسال رسالتكم. سنجيب في أقرب وقت ممكن.",
        err: "تعذّر الإرسال. أعيدوا المحاولة لاحقاً أو اتصلوا بنا.",
        net: "مشكلة في الاتصال. تحققوا من الشبكة وأعيدوا المحاولة.",
        wait: "جاري الإرسال…",
      },
    };
    return L[lang] || L.fr;
  }

  function postToInbox(fields, submitBtn, lang, endpoint) {
    var url = endpoint && String(endpoint).trim() ? String(endpoint).trim() : AHF_FORM_SUBMIT_AJAX;
    var m = formSubmitMessages(lang);
    var prevText = submitBtn ? submitBtn.textContent : "";
    var body = {};
    var reply = (fields.email && String(fields.email).trim()) || "";
    if (reply) body._replyto = reply;
    Object.keys(fields).forEach(function (k) {
      if (fields[k] !== undefined && fields[k] !== null) body[k] = fields[k];
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = m.wait;
    }

    /* Formspree accepte le format URL-encoded pour ce formulaire. */
    var params = new URLSearchParams();
    Object.keys(body).forEach(function (k) {
      var v = body[k];
      if (v !== undefined && v !== null) params.append(k, String(v));
    });

    return fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (ignore) {}
          var hasErrors = data && Array.isArray(data.errors) && data.errors.length > 0;
          return { ok: res.ok && !hasErrors, data: data };
        });
      })
      .catch(function () {
        return { ok: false, data: null };
      })
      .then(function (result) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = prevText;
        }
        if (result.ok) {
          window.alert(m.ok);
          return true;
        }
        if (result.data === null) {
          window.alert(m.net);
        } else {
          var apiMsg = result.data && result.data.message ? String(result.data.message).trim() : "";
          window.alert(apiMsg ? m.err + "\n\n" + apiMsg : m.err);
        }
        return false;
      });
  }

  function syncHeaderOffset() {
    var header = document.querySelector(".site-header");
    if (header) {
      document.documentElement.style.setProperty("--header-offset", header.offsetHeight + "px");
    }
  }

  function applySitemapBreadcrumb() {
    var crumbs = document.querySelectorAll(".site-map-crumb");
    if (!crumbs.length) return;

    var pathname = (window.location.pathname || "").replace(/\\/g, "/");
    var parts = pathname.split("/").filter(Boolean);
    var locale = "fr";
    if (parts[0] === "en" || parts[0] === "ar") locale = parts[0];
    var langMap = {
      fr: {
        labels: {
          index: "Accueil",
          expertise: "Expertise",
          "offre-iso-9001": "Offre ISO 9001",
          "a-propos": "À propos",
          references: "Références",
          contact: "Contact",
          cabinet: "Cabinet",
        },
      },
      en: {
        labels: {
          index: "Home",
          expertise: "Expertise",
          "offre-iso-9001": "ISO 9001 Offer",
          "a-propos": "About us",
          references: "References",
          contact: "Contact",
          cabinet: "Firm",
        },
      },
      ar: {
        labels: {
          index: "الرئيسية",
          expertise: "الخبرات",
          "offre-iso-9001": "عرض ISO 9001",
          "a-propos": "من نحن",
          references: "المراجع",
          contact: "الاتصال",
          cabinet: "المكتب",
        },
      },
    };
    var labels = (langMap[locale] || langMap.fr).labels;

    var file = parts.length ? parts[parts.length - 1] : "index.html";
    if (!/\.html$/i.test(file)) file = "index.html";
    var slug = file.replace(/\.html$/i, "").toLowerCase();

    var trail;
    if (slug === "offre-iso-9001") trail = ["expertise", "offre-iso-9001"];
    else if (slug === "a-propos") trail = ["cabinet", "a-propos"];
    else if (slug === "references") trail = ["cabinet", "references"];
    else trail = [slug];

    function hrefFor(key) {
      if (key === "cabinet") return null;
      return key === "index" ? "index.html" : key + ".html";
    }

    crumbs.forEach(function (crumb) {
      var svg = crumb.querySelector("svg");
      if (!svg) return;
      Array.prototype.slice.call(crumb.children).forEach(function (node) {
        if (node !== svg) crumb.removeChild(node);
      });

      var pathWrap = document.createElement("span");
      pathWrap.className = "site-map-crumb-path";

      trail.forEach(function (key, idx) {
        var sep = document.createElement("span");
        sep.className = "site-map-crumb-sep";
        sep.textContent = "/";
        pathWrap.appendChild(sep);

        var label = labels[key] || key;
        var isLast = idx === trail.length - 1;
        var href = hrefFor(key);

        if (!isLast && href) {
          var link = document.createElement("a");
          link.className = "site-map-crumb-link";
          link.href = href;
          link.textContent = label;
          pathWrap.appendChild(link);
        } else {
          var current = document.createElement("span");
          current.className = "site-map-crumb-current";
          current.textContent = label;
          pathWrap.appendChild(current);
        }
      });

      crumb.appendChild(pathWrap);
    });
  }

  function initLangDropdown() {
    document.querySelectorAll(".lang-switch").forEach(function (switcher) {
      var links = Array.prototype.slice.call(switcher.querySelectorAll("a"));
      if (links.length < 2) return;

      var current = switcher.querySelector("a.is-current") || links[0];
      var currentLabel = (current.textContent || "").trim() || "Lang";

      switcher.querySelectorAll(".lang-switch-sep").forEach(function (sep) {
        sep.remove();
      });

      var trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "lang-switch-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-label", "Changer de langue");
      trigger.innerHTML =
        '<span class="lang-switch-current">' +
        currentLabel +
        '</span><span class="lang-switch-caret" aria-hidden="true"></span>';

      var menu = document.createElement("div");
      menu.className = "lang-switch-menu";
      menu.setAttribute("role", "menu");

      links.forEach(function (link) {
        link.classList.add("lang-switch-item");
        link.removeAttribute("aria-current");
        link.setAttribute("role", "menuitem");
        if (link === current) link.setAttribute("aria-current", "page");
        menu.appendChild(link);
      });

      switcher.textContent = "";
      switcher.classList.add("is-dropdown");
      switcher.appendChild(trigger);
      switcher.appendChild(menu);

      function closeLangMenu() {
        switcher.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = !switcher.classList.contains("is-open");
        document.querySelectorAll(".lang-switch.is-open").forEach(function (other) {
          if (other !== switcher) {
            other.classList.remove("is-open");
            var otherBtn = other.querySelector(".lang-switch-trigger");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          }
        });
        switcher.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });

      menu.querySelectorAll("a").forEach(function (item) {
        item.addEventListener("click", closeLangMenu);
      });

      document.addEventListener("click", function (e) {
        if (!switcher.contains(e.target)) closeLangMenu();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLangMenu();
      });
    });
  }

  function initThemeToggle() {
    var root = document.documentElement;
    var storageKey = "ahf-theme";
    var lang = (root.getAttribute("lang") || "fr").toLowerCase();
    var labels = {
      fr: { dark: "Mode sombre", light: "Mode clair" },
      en: { dark: "Dark mode", light: "Light mode" },
      ar: { dark: "الوضع الداكن", light: "الوضع الفاتح" },
    };
    var L = labels[lang] || labels.fr;
    var saved = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch (ignore) {}
    var theme = saved === "dark" || saved === "light" ? saved : "light";
    root.setAttribute("data-theme", theme);

    var langSlot = document.querySelector(".header-slot-lang");
    var navList = document.querySelector(".nav-list");
    var buttons = [];

    function createThemeButton(extraClass) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle " + extraClass;
      btn.setAttribute("aria-live", "polite");
      btn.addEventListener("click", function () {
        var dark = root.getAttribute("data-theme") === "dark";
        var next = dark ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
          localStorage.setItem(storageKey, next);
        } catch (ignore) {}
        renderTheme();
      });
      buttons.push(btn);
      return btn;
    }

    if (langSlot && !langSlot.querySelector(".theme-toggle--header")) {
      langSlot.appendChild(createThemeButton("theme-toggle--header"));
    }

    if (navList && !navList.querySelector(".nav-theme-item")) {
      var navThemeItem = document.createElement("li");
      navThemeItem.className = "nav-theme-item";
      navThemeItem.appendChild(createThemeButton("theme-toggle--nav"));
      navList.appendChild(navThemeItem);
    }

    if (!buttons.length) return;

    function renderTheme() {
      var dark = root.getAttribute("data-theme") === "dark";
      var nextLabel = dark ? L.light : L.dark;
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", dark ? "true" : "false");
        btn.setAttribute("aria-label", nextLabel);
        btn.setAttribute("title", nextLabel);
        btn.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true">' + (dark ? "☀" : "☾") + "</span>";
      });
    }

    renderTheme();
  }

  function closeAllNavDropdowns() {
    document.querySelectorAll(".has-dropdown.is-open").forEach(function (li) {
      li.classList.remove("is-open");
      var b = li.querySelector(".nav-dropdown-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }

  syncHeaderOffset();
  applySitemapBreadcrumb();
  initLangDropdown();
  initThemeToggle();
  window.addEventListener("resize", syncHeaderOffset);
  window.addEventListener("load", syncHeaderOffset);
  /* iOS Safari : barre d’adresse qui réduit la hauteur visible — recalcul du menu fixe */
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncHeaderOffset);
  }

  var siteHeader = document.getElementById("site-header");
  /* Hystérésis : évite le « tremblement » quand scrollY oscille autour du seuil ou quand la hauteur du header modifie la position. */
  var HEADER_SCROLL_COMPACT = 96;
  var HEADER_SCROLL_EXPAND = 24;
  var HEADER_OFFSET_SYNC_FRAMES = 22;
  var HEADER_OFFSET_SYNC_MS = 450;
  var headerIsCompact = false;
  var headerOffsetAnimFrame = 0;
  var headerOffsetSyncTimeout = 0;
  function applyHeaderCompact() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-compact", headerIsCompact);
    syncHeaderOffset();
    /* Recalcule --header-offset pendant l’animation CSS (menu mobile, etc.) */
    if (headerOffsetAnimFrame) cancelAnimationFrame(headerOffsetAnimFrame);
    if (headerOffsetSyncTimeout) clearTimeout(headerOffsetSyncTimeout);
    var frame = 0;
    function stepHeaderOffset() {
      syncHeaderOffset();
      frame++;
      if (frame < HEADER_OFFSET_SYNC_FRAMES) headerOffsetAnimFrame = requestAnimationFrame(stepHeaderOffset);
      else headerOffsetAnimFrame = 0;
    }
    headerOffsetAnimFrame = requestAnimationFrame(stepHeaderOffset);
    headerOffsetSyncTimeout = window.setTimeout(function () {
      headerOffsetSyncTimeout = 0;
      syncHeaderOffset();
    }, HEADER_OFFSET_SYNC_MS);
  }
  var headerCompactScrollRaf = null;
  function updateHeaderCompact() {
    if (!siteHeader) return;
    if (headerCompactScrollRaf !== null) return;
    headerCompactScrollRaf = requestAnimationFrame(function () {
      headerCompactScrollRaf = null;
      var y = window.scrollY;
      var next = headerIsCompact;
      if (headerIsCompact) {
        if (y < HEADER_SCROLL_EXPAND) next = false;
      } else {
        if (y > HEADER_SCROLL_COMPACT) next = true;
      }
      if (next === headerIsCompact) return;
      headerIsCompact = next;
      applyHeaderCompact();
    });
  }
  if (siteHeader) {
    headerIsCompact = window.scrollY > HEADER_SCROLL_COMPACT;
    applyHeaderCompact();
    window.addEventListener("scroll", updateHeaderCompact, { passive: true });
    window.addEventListener("load", function () {
      var y = window.scrollY;
      headerIsCompact = y > HEADER_SCROLL_COMPACT;
      applyHeaderCompact();
    });
  }

  function isDesktopDropdownNav() {
    return window.matchMedia("(min-width: 901px)").matches;
  }

  /* Bureau : au survol d’un menu, fermer les autres (évite panneaux superposés survol + clic). */
  document.querySelectorAll(".has-dropdown").forEach(function (li) {
    li.addEventListener("mouseenter", function () {
      if (!isDesktopDropdownNav()) return;
      document.querySelectorAll(".has-dropdown.is-open").forEach(function (other) {
        if (other !== li) {
          other.classList.remove("is-open");
          var ob = other.querySelector(".nav-dropdown-btn");
          if (ob) ob.setAttribute("aria-expanded", "false");
        }
      });
    });
  });

  document.querySelectorAll(".nav-dropdown-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var li = btn.closest(".has-dropdown");
      if (!li) return;
      var opening = !li.classList.contains("is-open");
      document.querySelectorAll(".has-dropdown.is-open").forEach(function (other) {
        if (other !== li) {
          other.classList.remove("is-open");
          var ob = other.querySelector(".nav-dropdown-btn");
          if (ob) ob.setAttribute("aria-expanded", "false");
        }
      });
      if (opening) {
        li.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      } else {
        li.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("click", function () {
    closeAllNavDropdowns();
  });

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    function closeNav() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      closeAllNavDropdowns();
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  if (window.location.hash === "#fiche-accompagnement-iso") {
    var ficheDetails = document.getElementById("fiche-accompagnement-iso");
    if (ficheDetails && ficheDetails.tagName === "DETAILS") {
      ficheDetails.open = true;
    }
  }

  var contactQuickForm = document.getElementById("contact-quick-form");
  var MIN_SUBMIT_INTERVAL_MS = 6000;
  var lastQuickSubmitAt = 0;
  var lastFicheSubmitAt = 0;
  if (contactQuickForm) {
    contactQuickForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = document.documentElement.getAttribute("lang") || "fr";
      var now = Date.now();
      if (now - lastQuickSubmitAt < MIN_SUBMIT_INTERVAL_MS) return;
      var fd = new FormData(contactQuickForm);
      var website = (fd.get("website") || "").toString().trim();
      if (website) return;
      var sub = (fd.get("message_subject") || "").toString().trim();
      var msg = (fd.get("message") || "").toString().trim();
      var name = (fd.get("name") || "").toString().trim();
      var email = (fd.get("email") || "").toString().trim();
      var phone = (fd.get("phone") || "").toString().trim();
      if (!name) {
        var nameEl = document.getElementById("contact-name");
        if (nameEl) nameEl.focus();
        window.alert(
          lang === "en" ? "Please enter your name." : lang === "ar" ? "يرجى إدخال الاسم." : "Veuillez renseigner votre nom."
        );
        return;
      }
      if (!email) {
        var emailEl = document.getElementById("contact-email");
        if (emailEl) emailEl.focus();
        window.alert(
          lang === "en" ? "Please enter your email." : lang === "ar" ? "يرجى إدخال البريد." : "Veuillez renseigner votre e-mail."
        );
        return;
      }
      if (!sub) {
        var subEl = document.getElementById("contact-subject");
        if (subEl) subEl.focus();
        window.alert(
          lang === "en"
            ? "Please enter a subject."
            : lang === "ar"
              ? "يرجى إدخال الموضوع."
              : "Veuillez renseigner l’objet."
        );
        return;
      }
      if (!msg) {
        var msgEl = document.getElementById("contact-body");
        if (msgEl) msgEl.focus();
        window.alert(
          lang === "en"
            ? "Please enter a message."
            : lang === "ar"
              ? "يرجى إدخال الرسالة."
              : "Veuillez saisir votre message."
        );
        return;
      }
      var btn =
        document.querySelector('button[type="submit"][form="contact-quick-form"]') ||
        contactQuickForm.querySelector('button[type="submit"]');
      var formspreeAction = contactQuickForm.getAttribute("action");
      var objetPrefix =
        lang === "en" ? "Subject" : lang === "ar" ? "الموضوع" : "Objet";
      var messageWithObjet = objetPrefix + " : " + sub + "\n\n" + msg;
      postToInbox(
        {
          _subject: "[Site AHF] " + sub,
          name: name,
          email: email,
          phone: phone || "—",
          message_subject: sub,
          message: messageWithObjet,
        },
        btn,
        lang,
        formspreeAction
      ).then(function (sent) {
        if (sent) {
          lastQuickSubmitAt = now;
          contactQuickForm.reset();
        }
      });
    });
  }

  var ficheForm = document.querySelector("form.fiche-form[data-fiche-lang]");
  if (ficheForm) {
    ficheForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = ficheForm.getAttribute("data-fiche-lang") || "fr";
      var now = Date.now();
      if (now - lastFicheSubmitAt < MIN_SUBMIT_INTERVAL_MS) return;
      var labels = FICHE_FORM_LABELS[lang] || FICHE_FORM_LABELS.fr;
      var fd = new FormData(ficheForm);
      var website = (fd.get("website") || "").toString().trim();
      if (website) return;
      var lines = [];

      function line(key, value) {
        if (value === undefined || value === null) return;
        var s = String(value).trim();
        if (!s && key.indexOf("cert_") !== 0) return;
        var label = labels[key] || key;
        lines.push(label + " : " + (s || "—"));
      }

      line("legal_name", fd.get("legal_name"));
      line("legal_form", fd.get("legal_form"));
      line("address", fd.get("address"));
      line("phone_fax", fd.get("phone_fax"));
      line("web_email", fd.get("web_email"));
      line("activity_domain", fd.get("activity_domain"));

      lines.push("");
      lines.push("— " + (labels._rep || "Représentant") + " —");
      line("rep_lastname", fd.get("rep_lastname"));
      line("rep_firstname", fd.get("rep_firstname"));
      line("rep_title", fd.get("rep_title"));
      line("rep_phone", fd.get("rep_phone"));
      line("rep_email", fd.get("rep_email"));

      lines.push("");
      lines.push("— " + (labels._compl || "Complémentaires") + " —");
      line("date_founded", fd.get("date_founded"));
      line("years_experience", fd.get("years_experience"));
      line("employees_total", fd.get("employees_total"));
      line("employees_managers", fd.get("employees_managers"));

      var certs = [];
      if (fd.get("cert_iso9001")) certs.push("ISO 9001:2015");
      if (fd.get("cert_iso14001")) certs.push("ISO 14001:2015");
      if (fd.get("cert_iso45001")) certs.push("ISO 45001:2018");
      if (fd.get("cert_iso22000")) certs.push("ISO 22000:2018");
      if (fd.get("cert_other")) {
        var other = (fd.get("cert_other_detail") || "").trim();
        var otherLbl = lang === "en" ? "Other" : lang === "ar" ? "أخرى" : "Autre";
        certs.push(other ? otherLbl + " : " + other : otherLbl);
      }
      if (certs.length) line("certifications", certs.join(", "));
      else line("certifications", labels._cert_none || "—");

      line("training_desired", fd.get("training_desired"));
      line("certification_sites_count", fd.get("certification_sites_count"));
      line("structures_activities", fd.get("structures_activities"));
      line("other_information", fd.get("other_information"));

      lines.push("");
      lines.push("— " + (labels._refs || "Références") + " —");
      line("client_references", fd.get("client_references"));
      line("signed_by", fd.get("signed_by"));
      line("signed_date", fd.get("signed_date"));

      var body = lines.join("\n");
      var subject =
        lang === "en"
          ? "AHF CONSULTING — Client information sheet (website)"
          : lang === "ar"
            ? "AHF CONSULTING — استمارة معلومات (موقع)"
            : "AHF CONSULTING — Fiche de renseignements (site)";

      var repEmail = (fd.get("rep_email") || "").toString().trim();
      if (!repEmail) {
        var repMailInput = ficheForm.querySelector('[name="rep_email"]');
        if (repMailInput) repMailInput.focus();
        window.alert(
          lang === "en"
            ? "Please enter the representative’s email address so we can reply."
            : lang === "ar"
              ? "يرجى إدخال بريد الممثل للردّ عليكم."
              : "Veuillez renseigner l’e-mail du / de la représentant(e) pour que nous puissions répondre."
        );
        return;
      }

      var repName =
        [fd.get("rep_firstname"), fd.get("rep_lastname")]
          .map(function (x) {
            return (x || "").toString().trim();
          })
          .filter(Boolean)
          .join(" ") || (fd.get("signed_by") || "").toString().trim() || "—";

      var btn = ficheForm.querySelector('button[type="submit"]');
      var ficheAction = ficheForm.getAttribute("action");
      postToInbox(
        {
          _subject: "[Site AHF] " + subject,
          name: repName,
          email: repEmail,
          rep_phone: (fd.get("rep_phone") || "").toString().trim() || "—",
          sheet: subject,
          message: body,
        },
        btn,
        lang,
        ficheAction
      ).then(function (sent) {
        if (sent) {
          lastFicheSubmitAt = now;
          ficheForm.reset();
        }
      });
    });
  }

  /* Bouton retour en haut (toutes les pages) */
  function backToTopLabels() {
    var lang = document.documentElement.getAttribute("lang") || "fr";
    if (lang === "en") return { label: "Back to top" };
    if (lang === "ar") return { label: "العودة إلى الأعلى" };
    return { label: "Retour en haut de page" };
  }

  var backTopBtn = document.createElement("button");
  backTopBtn.type = "button";
  backTopBtn.className = "back-to-top";
  backTopBtn.setAttribute("aria-label", backToTopLabels().label);
  backTopBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 5l7 7h-4v7h-6v-7H5l7-7z"/></svg>';
  document.body.appendChild(backTopBtn);

  var BACK_TOP_SHOW_AT_DESKTOP = 320;
  var BACK_TOP_SHOW_AT_MOBILE = 140;
  var backTopRaf = null;
  function getScrollTop() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function backTopThreshold() {
    return window.matchMedia("(max-width: 900px)").matches ? BACK_TOP_SHOW_AT_MOBILE : BACK_TOP_SHOW_AT_DESKTOP;
  }

  function updateBackToTop() {
    if (backTopRaf !== null) return;
    backTopRaf = requestAnimationFrame(function () {
      backTopRaf = null;
      var show = getScrollTop() > backTopThreshold();
      backTopBtn.classList.toggle("is-visible", show);
    });
  }

  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  window.addEventListener("load", updateBackToTop);
  window.addEventListener("resize", updateBackToTop);

  backTopBtn.addEventListener("click", function () {
    var instant =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
    var target = document.getElementById("contenu") || document.querySelector("main");
    if (target && typeof target.focus === "function") {
      try {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      } catch (ignore) {}
    }
  });

  function initHomeHeroSwiper() {
    var el = document.querySelector(".home-hero-swiper");
    if (!el || typeof Swiper === "undefined") return;
    var rtl = document.documentElement.getAttribute("dir") === "rtl";
    var lang = (document.documentElement.getAttribute("lang") || "fr").toLowerCase();
    var a11yPrev =
      lang === "en" ? "Previous slide" : lang === "ar" ? "الشريحة السابقة" : "Diapositive précédente";
    var a11yNext =
      lang === "en" ? "Next slide" : lang === "ar" ? "الشريحة التالية" : "Diapositive suivante";
    new Swiper(el, {
      loop: true,
      speed: 650,
      rtl: rtl,
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: el.querySelector(".swiper-pagination"),
        clickable: true,
      },
      navigation: {
        nextEl: el.querySelector(".swiper-button-next"),
        prevEl: el.querySelector(".swiper-button-prev"),
      },
      a11y: {
        enabled: true,
        prevSlideMessage: a11yPrev,
        nextSlideMessage: a11yNext,
      },
    });
  }

  function initRevealOnScroll() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (n) {
        n.classList.add("is-revealed");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-revealed");
            obs.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    nodes.forEach(function (n) {
      obs.observe(n);
    });
  }

  initHomeHeroSwiper();
  initRevealOnScroll();

  /* Déplacer les réseaux sociaux du topbar vers le footer */
  (function moveSocialToFooter() {
    if (document.body.classList.contains("page-home")) return;
    var headerSocial = document.querySelector(".header-social");
    var footer = document.querySelector(".site-footer");
    if (!headerSocial || !footer) return;
    if (footer.querySelector(".footer-social")) return;

    var footerSocial = document.createElement("ul");
    footerSocial.className = "footer-social";
    footerSocial.setAttribute("aria-label", headerSocial.getAttribute("aria-label") || "Social links");
    footerSocial.innerHTML = headerSocial.innerHTML;

    var footerBottom = footer.querySelector(".footer-bottom");
    if (footerBottom && footerBottom.parentNode) {
      footerBottom.parentNode.insertBefore(footerSocial, footerBottom);
    } else {
      footer.appendChild(footerSocial);
    }
  })();
})();

var FICHE_FORM_LABELS = {
  fr: {
    _rep: "Représenté(e) par",
    _compl: "Informations complémentaires",
    _refs: "Vos références",
    _cert_none: "(aucune case cochée)",
    legal_name: "Appellation légale",
    legal_form: "Forme juridique",
    address: "Adresse",
    phone_fax: "Téléphone / Fax",
    web_email: "Site web / e-mail",
    activity_domain: "Domaine d’activité",
    rep_lastname: "Nom",
    rep_firstname: "Prénom",
    rep_title: "Fonction",
    rep_phone: "Tél. / Mob.",
    rep_email: "E-mail",
    date_founded: "Date de création",
    years_experience: "Années d’expérience",
    employees_total: "Nombre total d’employés",
    employees_managers: "Nombre d’employés cadres",
    certifications: "Certifications souhaitées",
    training_desired: "Formations souhaitées",
    certification_sites_count: "Nombre de sites concernés par la certification",
    structures_activities: "Structures / activités",
    other_information: "Autres informations",
    client_references: "Vos références",
    signed_by: "Fait par (nom et prénom)",
    signed_date: "Date",
  },
  en: {
    _rep: "Represented by",
    _compl: "Additional information",
    _refs: "Your references",
    _cert_none: "(none selected)",
    legal_name: "Legal name",
    legal_form: "Legal form",
    address: "Address",
    phone_fax: "Phone / Fax",
    web_email: "Website / email",
    activity_domain: "Field of activity",
    rep_lastname: "Last name",
    rep_firstname: "First name",
    rep_title: "Job title",
    rep_phone: "Phone / Mobile",
    rep_email: "Email",
    date_founded: "Date established",
    years_experience: "Years of experience",
    employees_total: "Total employees",
    employees_managers: "Management staff",
    certifications: "Desired certifications",
    training_desired: "Desired training",
    certification_sites_count: "Number of sites in scope",
    structures_activities: "Structures / activities",
    other_information: "Other information",
    client_references: "Your references",
    signed_by: "Completed by (name)",
    signed_date: "Date",
  },
  ar: {
    _rep: "يمثّله",
    _compl: "معلومات إضافية",
    _refs: "مراجعكم",
    _cert_none: "(لم يُحدد)",
    legal_name: "التسمية القانونية",
    legal_form: "الشكل القانوني",
    address: "العنوان",
    phone_fax: "الهاتف / الفاكس",
    web_email: "الموقع / البريد",
    activity_domain: "مجال النشاط",
    rep_lastname: "اللقب",
    rep_firstname: "الاسم",
    rep_title: "الوظيفة",
    rep_phone: "الهاتف / الجوال",
    rep_email: "البريد الإلكتروني",
    date_founded: "تاريخ التأسيس",
    years_experience: "سنوات الخبرة",
    employees_total: "إجمالي الموظفين",
    employees_managers: "موظفو الإدارة",
    certifications: "الشهادات المرغوبة",
    training_desired: "التكوينات المرغوبة",
    certification_sites_count: "عدد المواقع المعنية بالاعتماد",
    structures_activities: "الهياكل / الأنشطة",
    other_information: "معلومات أخرى",
    client_references: "مراجعكم",
    signed_by: "أعدّها (الاسم واللقب)",
    signed_date: "التاريخ",
  },
};
