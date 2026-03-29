(function () {
  /** Envoi vers la boîte cabinet via FormSubmit (https://formsubmit.co). Au premier message, confirmer l’activation depuis l’e-mail reçu sur cette boîte. */
  var AHF_INBOX_EMAIL = "beldimohamedlamine@gmail.com";
  var AHF_FORM_SUBMIT_AJAX = "https://formsubmit.co/ajax/" + AHF_INBOX_EMAIL;

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

  function postToInbox(fields, submitBtn, lang) {
    var m = formSubmitMessages(lang);
    var prevText = submitBtn ? submitBtn.textContent : "";
    var body = {
      _captcha: false,
      _template: "table",
    };
    var reply = (fields.email && String(fields.email).trim()) || "";
    if (reply) body._replyto = reply;
    Object.keys(fields).forEach(function (k) {
      if (fields[k] !== undefined && fields[k] !== null) body[k] = fields[k];
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = m.wait;
    }

    /* FormSubmit attend le même format qu’un <form> classique (comme l’exemple jQuery), pas du JSON brut. */
    var params = new URLSearchParams();
    Object.keys(body).forEach(function (k) {
      var v = body[k];
      if (v !== undefined && v !== null) params.append(k, String(v));
    });

    return fetch(AHF_FORM_SUBMIT_AJAX, {
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
          var success = data && (data.success === true || data.success === "true");
          return { ok: res.ok && success, data: data };
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

  function closeAllNavDropdowns() {
    document.querySelectorAll(".has-dropdown.is-open").forEach(function (li) {
      li.classList.remove("is-open");
      var b = li.querySelector(".nav-dropdown-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }

  syncHeaderOffset();
  window.addEventListener("resize", syncHeaderOffset);
  window.addEventListener("load", syncHeaderOffset);

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
  if (contactQuickForm) {
    contactQuickForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = document.documentElement.getAttribute("lang") || "fr";
      var fd = new FormData(contactQuickForm);
      var sub = (fd.get("subject") || "").toString().trim();
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
      postToInbox(
        {
          _subject: "[Site AHF] " + sub,
          name: name,
          email: email,
          phone: phone || "—",
          subject: sub,
          message: msg,
        },
        btn,
        lang
      ).then(function (sent) {
        if (sent) contactQuickForm.reset();
      });
    });
  }

  var ficheForm = document.querySelector("form.fiche-form[data-fiche-lang]");
  if (ficheForm) {
    ficheForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = ficheForm.getAttribute("data-fiche-lang") || "fr";
      var labels = FICHE_FORM_LABELS[lang] || FICHE_FORM_LABELS.fr;
      var fd = new FormData(ficheForm);
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
        lang
      ).then(function (sent) {
        if (sent) ficheForm.reset();
      });
    });
  }
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
