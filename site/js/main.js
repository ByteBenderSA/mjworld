/* =====================================================================
   MJNE WORLD — interactions
   ===================================================================== */
(function () {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------  Header: scroll state + hide on scroll-down  ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("scrolled", y > 24);
      // hide when scrolling down past hero-ish, show on up
      if (y > 520 && y > lastY + 6) header.classList.add("hide");
      else if (y < lastY - 6 || y < 200) header.classList.remove("hide");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------  Mobile drawer  ---------- */
  const drawer = document.querySelector(".drawer");
  const burger = document.querySelector(".burger");
  if (drawer && burger) {
    const close = () => { drawer.classList.remove("open"); document.body.style.overflow = ""; };
    burger.addEventListener("click", () => {
      drawer.classList.add("open"); document.body.style.overflow = "hidden";
    });
    drawer.querySelector(".scrim")?.addEventListener("click", close);
    drawer.querySelector(".d-close")?.addEventListener("click", close);
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* ----------  Scroll reveal  ---------- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach(el => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(el => io.observe(el));
    }
  }

  /* ----------  Animated counters  ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split(".")[1] || "").length;
      const dur = 1600; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = dec ? target.toFixed(dec) : Math.round(target).toLocaleString();
      };
      requestAnimationFrame(tick);
    };
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(animate);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.5 });
      counters.forEach(el => io.observe(el));
    }
  }

  /* ----------  Hero carousel  ---------- */
  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dots button"));
    const countEl = hero.querySelector("[data-hero-count]");
    const prevBtn = hero.querySelector("[data-hero-prev]");
    const nextBtn = hero.querySelector("[data-hero-next]");
    const DUR = 7000;
    let idx = 0, timer = null, raf = null, startTime = 0;

    const setFill = (dot, pct) => { const f = dot.querySelector(".fill"); if (f) f.style.width = pct + "%"; };

    const progress = (now) => {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / DUR * 100, 100);
      if (dots[idx]) setFill(dots[idx], pct);
      if (elapsed < DUR) raf = requestAnimationFrame(progress);
    };

    const go = (n, manual) => {
      slides[idx].classList.remove("active");
      dots[idx]?.classList.remove("active");
      if (dots[idx]) setFill(dots[idx], 0);
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add("active");
      dots[idx]?.classList.add("active");
      if (countEl) countEl.querySelector("b").textContent = String(idx + 1).padStart(2, "0");
      cancelAnimationFrame(raf);
      startTime = performance.now();
      if (!prefersReduced) raf = requestAnimationFrame(progress);
      if (manual) restart();
    };
    const next = () => go(idx + 1);
    const prev = () => go(idx - 1);
    const restart = () => { clearInterval(timer); timer = setInterval(next, DUR); };

    dots.forEach((d, i) => d.addEventListener("click", () => go(i, true)));
    nextBtn?.addEventListener("click", () => go(idx + 1, true));
    prevBtn?.addEventListener("click", () => go(idx - 1, true));

    // keyboard
    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") go(idx + 1, true);
      if (e.key === "ArrowLeft") go(idx - 1, true);
    });
    // swipe
    let tx = 0;
    hero.addEventListener("touchstart", e => tx = e.touches[0].clientX, { passive: true });
    hero.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) (dx < 0 ? () => go(idx + 1, true) : () => go(idx - 1, true))();
    }, { passive: true });
    // pause on hover (desktop)
    hero.addEventListener("mouseenter", () => { clearInterval(timer); cancelAnimationFrame(raf); });
    hero.addEventListener("mouseleave", () => { startTime = performance.now() - 0; if (!prefersReduced) raf = requestAnimationFrame(progress); restart(); });
    // pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { clearInterval(timer); cancelAnimationFrame(raf); }
      else { startTime = performance.now(); if (!prefersReduced) raf = requestAnimationFrame(progress); restart(); }
    });

    go(0);
    restart();
  }

  /* ----------  Accordion  ---------- */
  document.querySelectorAll(".accordion").forEach(acc => {
    acc.querySelectorAll(".acc-item").forEach(item => {
      const q = item.querySelector(".acc-q");
      const a = item.querySelector(".acc-a");
      q?.addEventListener("click", () => {
        const open = item.classList.contains("open");
        if (!acc.dataset.multi) {
          acc.querySelectorAll(".acc-item.open").forEach(o => {
            o.classList.remove("open"); o.querySelector(".acc-a").style.maxHeight = null;
          });
        }
        if (open) { item.classList.remove("open"); a.style.maxHeight = null; }
        else { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
      });
    });
  });

  /* ----------  Product gallery thumbs  ---------- */
  document.querySelectorAll("[data-gallery]").forEach(g => {
    const main = g.querySelector("[data-gallery-main] img");
    g.querySelectorAll(".pd-thumbs button").forEach(btn => {
      btn.addEventListener("click", () => {
        g.querySelectorAll(".pd-thumbs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const src = btn.querySelector("img").src;
        if (main) { main.style.opacity = 0; setTimeout(() => { main.src = src; main.style.opacity = 1; }, 150); }
      });
    });
  });

  /* ----------  Forms (mailto handoff, no backend)  ---------- */
  const buildMailtoBody = (form) => {
    const lines = [];
    const seenCheckbox = new Set();
    form.querySelectorAll("input, textarea, select").forEach(el => {
      if (!el.name) return;
      const label = (el.closest(".field")?.querySelector("label")?.textContent
        || el.closest("fieldset")?.querySelector("legend")?.textContent
        || el.name).replace(/\*.*/, "").trim();
      if (el.type === "checkbox") {
        if (el.checked) {
          if (!seenCheckbox.has(el.name)) {
            const values = Array.from(form.querySelectorAll(`input[name="${el.name}"]:checked`)).map(c => c.value);
            lines.push(`${label}: ${values.join(", ")}`);
            seenCheckbox.add(el.name);
          }
        }
      } else if (el.type === "radio") {
        if (el.checked) lines.push(`${label}: ${el.value}`);
      } else if (el.value && el.value.trim()) {
        lines.push(`${label}: ${el.value.trim()}`);
      }
    });
    return lines.join("\n");
  };

  document.querySelectorAll("[data-form]").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const kind = form.dataset.form;
      const action = form.getAttribute("action") || "";
      const to = action.replace(/^mailto:/, "").split("?")[0];
      const isQuote = kind === "quote";

      if (isQuote) {
        const checked = form.querySelectorAll('input[name="interest"]:checked');
        if (checked.length === 0) {
          const legend = form.querySelector(".checkbox-field legend");
          if (legend) { legend.style.color = "#c0392b"; setTimeout(() => legend.style.color = "", 3500); }
          form.querySelector(".checkbox-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }

      const interestVals = Array.from(form.querySelectorAll('input[name="interest"]:checked')).map(c => c.value);
      const subject = isQuote
        ? `Quote request${interestVals.length ? " — " + interestVals.join(", ") : ""}`
        : `Website enquiry${form.querySelector('[name="topic"]')?.value ? " — " + form.querySelector('[name="topic"]').value : ""}`;
      const body = buildMailtoBody(form);

      const mailto = (to ? `mailto:${to}` : "mailto:") +
        `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const ok = form.querySelector(".form-success");
      const btn = form.querySelector("[type=submit]");
      const originalLabel = btn?.dataset.label || btn?.textContent || "Send";
      if (btn) { btn.textContent = "Opening your email…"; btn.disabled = true; }

      window.location.href = mailto;

      setTimeout(() => {
        if (btn) { btn.textContent = originalLabel; btn.disabled = false; }
        if (ok) {
          ok.classList.add("show");
          ok.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => ok.classList.remove("show"), 8000);
        }
      }, 900);
    });
  });

  /* ----------  3D motion: tilt · magnetic · parallax  ---------- */
  (function motion() {
    if (prefersReduced) return;
    const fine = window.matchMedia("(pointer: fine)").matches;

    if (fine) {
      // -- pointer tilt (depth) --
      const set = new Set(document.querySelectorAll("[data-tilt]"));
      document.querySelectorAll(
        ".product, .division, .quote-card, .pd-gallery .main, .media-frame.tall, .media-frame.wide, .hero .panel"
      ).forEach(el => set.add(el));

      set.forEach(el => {
        const isCard = el.classList.contains("product") || el.classList.contains("division");
        const isPanel = el.classList.contains("panel");
        const max = el.dataset.tilt ? parseFloat(el.dataset.tilt) : (isPanel ? 12 : isCard ? 6 : 5);
        const lift = el.dataset.lift != null ? parseFloat(el.dataset.lift) : (isCard ? 8 : 0);
        let raf;
        el.addEventListener("pointerenter", () => { el.style.transition = "transform .12s ease-out"; el.style.willChange = "transform"; });
        el.addEventListener("pointermove", e => {
          const r = el.getBoundingClientRect();
          const cx = (e.clientX - r.left) / r.width - .5;
          const cy = (e.clientY - r.top) / r.height - .5;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            el.style.transform = `perspective(1100px) rotateX(${(-cy * max).toFixed(2)}deg) rotateY(${(cx * max).toFixed(2)}deg) translateY(${(-lift).toFixed(1)}px)`;
            el.querySelectorAll("[data-depth]").forEach(d => {
              const z = parseFloat(d.dataset.depth) || 0;
              d.style.transform = `translate3d(${(cx * z).toFixed(1)}px, ${(cy * z).toFixed(1)}px, 0)`;
            });
          });
        });
        el.addEventListener("pointerleave", () => {
          cancelAnimationFrame(raf);
          el.style.transition = ""; el.style.transform = ""; el.style.willChange = "";
          el.querySelectorAll("[data-depth]").forEach(d => d.style.transform = "");
        });
      });

      // -- magnetic buttons --
      const mag = new Set(document.querySelectorAll("[data-magnetic]"));
      document.querySelectorAll(".hero-actions .btn, .cta-banner .btn").forEach(b => mag.add(b));
      mag.forEach(el => {
        const s = el.dataset.magnetic ? parseFloat(el.dataset.magnetic) : .25;
        let raf;
        el.addEventListener("pointerenter", () => { el.style.transition = "transform .18s ease-out"; });
        el.addEventListener("pointermove", e => {
          const r = el.getBoundingClientRect();
          const mx = e.clientX - (r.left + r.width / 2);
          const my = e.clientY - (r.top + r.height / 2);
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => { el.style.transform = `translate(${(mx * s).toFixed(1)}px, ${(my * s - 2).toFixed(1)}px)`; });
        });
        el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); el.style.transition = ""; el.style.transform = ""; });
      });
    }

    // -- scroll parallax (depth on glows & hero texture) — works on touch too --
    const pEls = Array.from(document.querySelectorAll("[data-parallax], .page-hero .glow, .cta-banner .glow, .hero .dot-grid"));
    if (pEls.length) {
      const meta = pEls.map(el => ({
        el,
        k: el.dataset.parallax ? parseFloat(el.dataset.parallax)
          : el.classList.contains("glow") ? .12
          : el.classList.contains("dot-grid") ? .07 : .15
      }));
      let ticking = false;
      const upd = () => {
        const vh = window.innerHeight;
        meta.forEach(({ el, k }) => {
          const r = el.getBoundingClientRect();
          const c = r.top + r.height / 2 - vh / 2;
          el.style.transform = `translate3d(0, ${(-c * k).toFixed(1)}px, 0)`;
        });
        ticking = false;
      };
      window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener("resize", upd, { passive: true });
      upd();
    }
  })();

  /* ----------  Prefill from ?product= / ?subject= / ?interest= ---------- */
  try {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product") || params.get("subject");
    const interests = params.getAll("interest");
    if (product) {
      document.querySelectorAll("[data-prefill='product']").forEach(el => {
        if (el.tagName === "SELECT") {
          const opt = Array.from(el.options).find(o => o.value === product || o.textContent.trim() === product);
          if (opt) { el.value = opt.value; }
          else { const o = new Option(product, product, true, true); el.add(o); }
        } else { el.value = product; }
      });
      document.querySelectorAll("[data-prefill='note']").forEach(el => {
        if (!el.value) el.value = "I'm interested in: " + product;
      });
    }
    if (interests.length) {
      document.querySelectorAll("[data-prefill-check] input[type='checkbox']").forEach(cb => {
        if (interests.includes(cb.value)) cb.checked = true;
      });
    }
    // auto-open quote form when hash targets it
    if (window.location.hash === "#quote") {
      const el = document.getElementById("quote");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  } catch (e) {}

  /* ----------  Footer year  ---------- */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
