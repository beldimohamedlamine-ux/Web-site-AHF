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
  if (toggle && nav) {
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
  }

  if (window.location.hash === "#fiche-accompagnement-iso") {
    var ficheDetails = document.getElementById("fiche-accompagnement-iso");
    if (ficheDetails && ficheDetails.tagName === "DETAILS") {
      ficheDetails.open = true;
    }
  }

  var contactMailtoBtn = document.getElementById("contact-mailto-btn");
  var contactSubject = document.getElementById("contact-subject");
  var contactBody = document.getElementById("contact-body");
  if (contactMailtoBtn && contactSubject && contactBody) {
    contactMailtoBtn.addEventListener("click", function () {
      var lang = document.documentElement.getAttribute("lang") || "fr";
      var sub = contactSubject.value.trim();
      var bod = contactBody.value.trim();
      if (!sub) {
        contactSubject.focus();
        window.alert(
          lang === "en"
            ? "Please enter a subject."
            : lang === "ar"
              ? "يرجى إدخال الموضوع."
              : "Veuillez renseigner l’objet."
        );
        return;
      }
      if (!bod) {
        contactBody.focus();
        window.alert(
          lang === "en"
            ? "Please enter a message."
            : lang === "ar"
              ? "يرجى إدخال الرسالة."
              : "Veuillez saisir votre message."
        );
        return;
      }
      window.location.href =
        "mailto:ahf.consulting.dz@gmail.com?subject=" +
        encodeURIComponent(sub) +
        "&body=" +
        encodeURIComponent(bod);
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
          ? "AHF CONSULTING — Client information sheet"
          : lang === "ar"
            ? "AHF CONSULTING — استمارة معلومات الزبون"
            : "AHF CONSULTING — Fiche de renseignements";

      var mailto =
        "mailto:ahf.consulting.dz@gmail.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      if (mailto.length > 7800) {
        window.alert(
          lang === "en"
            ? "Message is too long for automatic email. Please copy your answers from the page or shorten the text."
            : lang === "ar"
              ? "الرسالة طويلة جداً. يرجى تقصير النص أو النسخ يدوياً."
              : "Le message est trop long pour l’e-mail automatique. Raccourcissez certains champs ou contactez-nous par téléphone."
        );
        return;
      }

      window.location.href = mailto;
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
