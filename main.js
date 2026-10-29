// Toutous et Gros Minets — interactions
// À renseigner : adresse de réception des demandes (formsubmit.co).
// Vide = la demande part par SMS pré-rempli vers Manon.
const FORM_EMAIL = "";
const PHONE = "+33677629794";

document.documentElement.classList.add("js");

// En-tête : bordure au défilement
const header = document.querySelector(".top");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Carnet de colo : onglets accessibles (flèches gauche/droite)
const diary = document.querySelector("[data-diary]");
if (diary) {
  const tabs = [...diary.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
}

// Cartes postales : on double chaque piste pour une boucle continue
document.querySelectorAll(".marquee__track").forEach((track) => {
  const n = track.children.length;
  [...track.children].forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
  track.style.setProperty("--dur", `${n * 9}s`);
});

// Questionnaire « Quel séjour pour mon loulou ? »
const quiz = document.querySelector("[data-quiz]");
const presta = document.getElementById("presta");
const msg = document.getElementById("msg");
if (quiz) {
  const box = quiz.querySelector(".quiz__result");
  const title = quiz.querySelector("[data-r-title]");
  const text = quiz.querySelector("[data-r-text]");
  const cta = quiz.querySelector("[data-r-cta]");
  let choice = null;

  quiz.addEventListener("change", () => {
    const f = new FormData(quiz);
    const who = f.get("who"), time = f.get("time"), first = f.get("first");
    if (!who || !time || !first) return;

    let t, p, option;
    if (who === "chat") {
      option = "Garde de chat";
      t = "Les gros minets";
      p = time === "sejour"
        ? "Votre chat peut séjourner à la pension, ou Manon passe chez vous chaque jour avec un compte rendu en photos. Elle assure aussi les traitements."
        : "Pour une courte absence, une visite à domicile suffit souvent : repas, câlins et photos pour vous.";
    } else if (time === "heures") {
      option = "Balade en groupe";
      t = "Une balade avec la bande";
      p = "Une grande balade en groupe, adaptée à son âge et à son gabarit. Idéal pour qu'il se dépense et se fasse des copains.";
    } else if (time === "jour") {
      option = "Garde à la journée";
      t = "La garde à la journée";
      p = "Dépôt le matin, retour le soir avec un chien fatigué et content. Balades, jardin et copains au programme.";
    } else {
      option = "Pension (séjour jour et nuit)";
      t = "La pension familiale";
      p = "Il vit à la maison avec la bande : balades, jardin, sieste au salon. Vous recevez photos et vidéos chaque jour.";
    }
    if (who !== "chat" && first === "oui") {
      p += who === "chiot"
        ? " Pour un premier séjour de chiot, Manon commence par une rencontre puis une journée d'essai."
        : " Pour une première fois, on commence par une rencontre puis une journée ou une nuit d'essai.";
    }
    title.textContent = t;
    text.textContent = p;
    choice = { option, who, first };
    box.hidden = false;
  });

  cta.addEventListener("click", () => {
    if (!choice) return;
    presta.value = choice.option;
    if (!msg.value) {
      const animal = { chien: "mon chien", chiot: "mon chiot", chat: "mon chat" }[choice.who];
      msg.value = `Bonjour Manon, c'est pour ${animal}${choice.first === "oui" ? ", sa première fois en pension" : ""}. Nos dates : `;
    }
    setTimeout(() => document.getElementById("nom").focus({ preventScroll: true }), 500);
  });
}

// Formulaire de contact
const form = document.getElementById("contactForm");
const sent = document.getElementById("sent");
if (form) {
  const fields = {
    nom: { el: form.nom, ok: (v) => v.trim().length > 1 },
    tel: { el: form.telephone, ok: (v) => v.replace(/\D/g, "").replace(/^33/, "0").length >= 10 },
  };
  const check = (key) => {
    const { el, ok } = fields[key];
    const valid = ok(el.value);
    el.setAttribute("aria-invalid", !valid);
    document.getElementById(`${key}-err`).hidden = valid;
    return valid;
  };
  Object.keys(fields).forEach((k) => fields[k].el.addEventListener("blur", () => fields[k].el.value && check(k)));

  const done = (viaSms) => {
    form.hidden = true;
    sent.hidden = false;
    if (viaSms) {
      sent.querySelector("[data-sent-text]").textContent =
        "Votre message est prêt dans votre application SMS. Envoyez-le, Manon vous rappelle sous 24h.";
    }
    sent.focus();
  };

  const sms = (data) => {
    const body = [
      `Bonjour Manon, demande de ${data.nom} (${data.telephone}).`,
      data.animal && `Loulou : ${data.animal}.`,
      `Besoin : ${data.prestation}.`,
      data.message,
    ].filter(Boolean).join(" ");
    window.location.href = `sms:${PHONE}?&body=${encodeURIComponent(body)}`;
    done(true);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const okNom = check("nom"), okTel = check("tel");
    if (!okNom || !okTel) {
      (okNom ? fields.tel.el : fields.nom.el).focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (!FORM_EMAIL) return sms(data);

    const btn = form.querySelector("button[type=submit]");
    btn.setAttribute("aria-busy", "true");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${FORM_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, _subject: `Nouvelle demande : ${data.prestation}`, _template: "table" }),
      });
      if (!res.ok) throw new Error(res.status);
      done(false);
    } catch {
      sms(data);
    } finally {
      btn.removeAttribute("aria-busy");
    }
  });
}

// Apparition douce des sections
const io = "IntersectionObserver" in window && new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".sec-head, .card, .path__step, .diary, .quiz__card, .bento, .acc, .form-card, .quote").forEach((el) => {
  if (!io) return;
  el.classList.add("reveal");
  io.observe(el);
});
