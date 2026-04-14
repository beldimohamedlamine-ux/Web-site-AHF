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

  /** Décalage ancres (scroll-padding / scroll-margin) : mesuré une seule fois en haut de page, pas lié au mode compact. */
  function syncHeaderScrollPadding() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    if (window.scrollY > 48) return;
    document.documentElement.style.setProperty(
      "--header-scroll-padding",
      Math.ceil(header.offsetHeight + 16) + "px"
    );
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
          "a-propos": "Qui sommes-nous ?",
          contact: "Contact",
          cabinet: "Cabinet",
        },
      },
      en: {
        labels: {
          index: "Home",
          expertise: "Expertise",
          "a-propos": "Who we are?",
          contact: "Contact",
          cabinet: "Firm",
        },
      },
      ar: {
        labels: {
          index: "الرئيسية",
          expertise: "الخبرات",
          "a-propos": "من نحن؟",
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
    if (slug === "a-propos") trail = ["cabinet", "a-propos"];
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

  function closeAllNavDropdowns() {
    document.querySelectorAll(".has-dropdown.is-open").forEach(function (li) {
      li.classList.remove("is-open");
      var b = li.querySelector(".nav-dropdown-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }

  /** Un seul lien du menu principal avec pastille active (clic + URL + hash). */
  function initHeaderNavActivePill() {
    var nav = document.getElementById("nav-principal");
    if (!nav) return;
    var links = nav.querySelectorAll(".nav-list > li > a");
    if (!links.length) return;

    function htmlFileFromPathname(path) {
      if (!path) return "index.html";
      var p = String(path).replace(/\\/g, "/").replace(/\/+$/, "");
      var parts = p.split("/").filter(Boolean);
      var last = parts.length ? parts[parts.length - 1] : "";
      if (/\.html$/i.test(last)) return last;
      return "index.html";
    }

    function safeUrl(href) {
      if (!href || typeof href !== "string") return null;
      try {
        return new URL(href, window.location.href);
      } catch (e) {
        return null;
      }
    }

    function clearActive() {
      links.forEach(function (a) {
        a.classList.remove("is-nav-active");
        a.removeAttribute("aria-current");
      });
    }

    function setActive(anchor) {
      if (!anchor) return;
      clearActive();
      anchor.classList.add("is-nav-active");
      anchor.setAttribute("aria-current", "page");
    }

    function findBestMatchForLocation() {
      var locUrl = safeUrl(window.location.href);
      if (!locUrl) return null;
      var locFile = htmlFileFromPathname(locUrl.pathname).toLowerCase();
      var locHash = (locUrl.hash || "").toLowerCase();

      var sameFile = [];
      Array.prototype.forEach.call(links, function (a) {
        var href = a.getAttribute("href");
        if (!href) return;
        var u = safeUrl(href);
        if (!u) return;
        var f = htmlFileFromPathname(u.pathname).toLowerCase();
        if (f === locFile) sameFile.push(a);
      });
      if (!sameFile.length) return null;

      if (locHash) {
        for (var i = 0; i < sameFile.length; i++) {
          var u1 = safeUrl(sameFile[i].getAttribute("href"));
          if (u1 && (u1.hash || "").toLowerCase() === locHash) return sameFile[i];
        }
        for (var j = 0; j < sameFile.length; j++) {
          var u2 = safeUrl(sameFile[j].getAttribute("href"));
          if (u2 && !u2.hash) return sameFile[j];
        }
        return sameFile[0];
      }

      for (var k = 0; k < sameFile.length; k++) {
        var u3 = safeUrl(sameFile[k].getAttribute("href"));
        if (u3 && !u3.hash) return sameFile[k];
      }
      return sameFile[0];
    }

    function syncFromLocation() {
      var match = findBestMatchForLocation();
      if (match) setActive(match);
      else clearActive();
    }

    nav.addEventListener(
      "click",
      function (e) {
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var t = e.target && e.target.closest ? e.target.closest("a") : null;
        if (!t || !nav.contains(t)) return;
        setActive(t);
      },
      false
    );

    window.addEventListener("hashchange", syncFromLocation, false);
    window.addEventListener("popstate", syncFromLocation, false);
    syncFromLocation();
  }

  syncHeaderScrollPadding();
  applySitemapBreadcrumb();
  initLangDropdown();
  initHeaderNavActivePill();
  function normalizeHashScrollPosition() {
    var rawHash = window.location.hash || "";
    if (!rawHash || rawHash.length < 2) return;
    var id = "";
    try {
      id = decodeURIComponent(rawHash.slice(1));
    } catch (e) {
      id = rawHash.slice(1);
    }
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var header = document.querySelector(".site-header");
    var headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    var top = Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - headerOffset - 12));
    window.scrollTo({ top: top, behavior: "auto" });
  }

  window.addEventListener("hashchange", function () {
    normalizeHashScrollPosition();
    window.requestAnimationFrame(normalizeHashScrollPosition);
  });

  window.addEventListener("load", function () {
    normalizeHashScrollPosition();
    window.setTimeout(normalizeHashScrollPosition, 120);
  });
  window.addEventListener("resize", syncHeaderScrollPadding);
  window.addEventListener("load", syncHeaderScrollPadding);
  /* iOS Safari : barre d’adresse qui réduit la hauteur visible — recalcul du décalage ancres */
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncHeaderScrollPadding);
  }

  var siteHeader = document.getElementById("site-header");
  /* Hystérésis : évite les oscillations au seuil. --header-offset est défini en CSS (pas de setProperty au scroll). */
  var HEADER_SCROLL_COMPACT = 132;
  var HEADER_SCROLL_EXPAND = 40;
  var headerIsCompact = false;
  function applyHeaderCompact() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-compact", headerIsCompact);
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

  /* Bouton WhatsApp flottant (toutes les pages) */
  function whatsappFloatLabels() {
    var lang = document.documentElement.getAttribute("lang") || "fr";
    if (lang === "en") return { label: "Open WhatsApp chat", notif: "1", title: "WhatsApp" };
    if (lang === "ar") return { label: "فتح محادثة واتساب", notif: "1", title: "واتساب" };
    return { label: "Ouvrir la discussion WhatsApp", notif: "1", title: "WhatsApp" };
  }

  function initWhatsAppFloat() {
    var labels = whatsappFloatLabels();
    var waBtn = document.createElement("a");
    waBtn.className = "whatsapp-float";
    waBtn.setAttribute("aria-label", labels.label);
    waBtn.setAttribute("title", labels.title);
    waBtn.setAttribute("target", "_blank");
    waBtn.setAttribute("rel", "noopener noreferrer");
    /* TODO : remplacez le numéro par votre WhatsApp final si besoin. */
    waBtn.href = "https://wa.me/213661467003";
    waBtn.innerHTML =
      '<span class="whatsapp-float__pulse" aria-hidden="true"></span>' +
      '<span class="whatsapp-float__icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M20.5 3.5A11.8 11.8 0 0012.1 0C5.7 0 .5 5.2.5 11.6c0 2 .5 4 1.5 5.8L0 24l6.8-1.8a11.7 11.7 0 005.3 1.3h.1c6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6-3.3-8.4zM12.2 21.4h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-4 .9.9-3.8-.2-.3a9.5 9.5 0 01-1.5-5c0-5.2 4.2-9.4 9.4-9.4 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7 0 5.2-4.2 9.5-9.5 9.5zm5.2-7.1c-.3-.2-1.9-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.7-.9-.8-1.5-1.9-1.7-2.2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.5-.9-2.1-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4s1 2.8 1.2 3.1c.1.2 2 3.1 4.8 4.3.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3z"/></svg>' +
      "</span>" +
      '<span class="whatsapp-float__notif" aria-hidden="true">' +
      labels.notif +
      "</span>";
    document.body.appendChild(waBtn);
  }

  function initClientsCarousel() {
    var el = document.querySelector(".clients-swiper");
    if (!el || typeof Swiper === "undefined") return;
    var rtl = document.documentElement.getAttribute("dir") === "rtl";
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pag = el.querySelector(".clients-swiper-pagination");
    new Swiper(el, {
      loop: !reduceMotion,
      slidesPerView: 2,
      slidesPerGroup: 1,
      spaceBetween: 12,
      speed: reduceMotion ? 0 : 1400,
      rtl: rtl,
      watchOverflow: true,
      keyboard: { enabled: true, onlyInViewport: true },
      autoplay: reduceMotion
        ? false
        : {
            delay: 900,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: true,
          },
      pagination: pag
        ? {
            el: pag,
            clickable: true,
            dynamicBullets: true,
          }
        : undefined,
      breakpoints: {
        520: {
          slidesPerView: 3,
          slidesPerGroup: 1,
          spaceBetween: 14,
        },
        768: {
          slidesPerView: 4,
          slidesPerGroup: 1,
          spaceBetween: 16,
        },
        1100: {
          slidesPerView: 5,
          slidesPerGroup: 1,
          spaceBetween: 18,
        },
      },
    });
  }

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
  initClientsCarousel();
  initRevealOnScroll();
  initWhatsAppFloat();
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
