/* =====================================================================
       stack.js - Overlapping Section / Card Stacking Scroll
       ===================================================================== */
(() => {
    "use strict";

    const doc = document.documentElement;
    const hero = document.getElementById("hero");
    const stick = hero && hero.querySelector(".stick");
    const panels = [...document.querySelectorAll("body > section.sec")];
    if (!hero || !stick || !panels.length) return;

    /* ---------- pengaturan efek (ubah di sini) ---------- */
    const TAU = 100;
    const DESKTOP = { scale: 0.93, dim: 0.5 };
    const MOBILE = { scale: 0.955, dim: 0.42 };
    const EPS = 0.0015;

    const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
    const mqSmall = matchMedia("(max-width: 800px)");
    const mqCoarse = matchMedia("(pointer: coarse)");

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
    const collapse = (a, b) => (a < 0 && b < 0 ? Math.min(a, b) : a >= 0 && b >= 0 ? Math.max(a, b) : a + b);

    // layer 0 
    const layers = [{ el: hero, fx: stick, hero: true }, ...panels.map((el) => ({ el, fx: el }))];
    const N = layers.length;
    const topY = new Array(N).fill(0);
    const hgt = new Array(N).fill(0);
    const cur = new Array(N).fill(0);
    const flag = layers.map(() => ({ rec: false, bur: false }));


    let enabled = false, snap = true;
    let vh = innerHeight, vw = innerWidth, lastVh = 0;
    let raf = 0, lastT = 0, mRaf = 0;

    /* ---------- ukur layout ---------- */
    function measure() {
        vh = innerHeight; vw = innerWidth;
        if (vh !== lastVh) { doc.style.setProperty("--vh", vh + "px"); lastVh = vh; }

        // BACA semua dulu...
        let y = 0, prevMb = 0;
        layers.forEach((L, i) => {
            const cs = getComputedStyle(L.el);
            y += collapse(prevMb, parseFloat(cs.marginTop) || 0);
            topY[i] = y;
            hgt[i] = parseFloat(cs.height) || L.el.offsetHeight;
            y += hgt[i];
            prevMb = parseFloat(cs.marginBottom) || 0;
        });

        // ...baru TULIS
        layers.forEach((L, i) => {
            if (i === 0) return;
            const last = i === N - 1;
            L.el.style.top = last ? "" : Math.min(0, vh - hgt[i]) + "px";
            const oy = hgt[i] >= vh ? hgt[i] - vh / 2 : hgt[i] / 2;
            L.fx.style.transformOrigin = `50% ${oy}px`;
        });

        snap = true;
        request();
    }

    function scheduleMeasure() {
        if (mRaf) return;
        mRaf = requestAnimationFrame(() => { mRaf = 0; if (enabled) measure(); });
    }

    /* ---------- loop efek ---------- */
    function request() { if (!raf && enabled) raf = requestAnimationFrame(tick); }

    function tick(t) {
        raf = 0;
        if (!enabled) return;

        const dt = lastT ? Math.min(64, t - lastT) : 16;
        lastT = t;
        const sy = scrollY;
        const k = 1 - Math.exp(-dt / TAU);
        const cfg = mqSmall.matches ? MOBILE : DESKTOP;
        const bury = Math.max(80, vh * 0.12);
        let moving = false;

        for (let i = 0; i < N - 1; i++) {
            const nt = topY[i + 1] - sy;
            const goal = clamp((vh - nt) / vh);
            const d = goal - cur[i];
            const mv = !snap && Math.abs(d) >= EPS;
            const c = mv ? cur[i] + d * k : goal;
            if (mv) moving = true;

            const L = layers[i], f = flag[i];
            if (c !== cur[i]) {
                cur[i] = c;
                const s = L.fx.style;
                if (c <= 0) {
                    s.transform = "";
                    s.removeProperty("--dim");
                    if (L.hero) s.removeProperty("--p");
                } else {
                    s.transform = `scale(${(1 - (1 - cfg.scale) * c).toFixed(4)})`;
                    s.setProperty("--dim", (cfg.dim * c).toFixed(3));
                    if (L.hero) s.setProperty("--p", c.toFixed(3));
                }
            }

            // promosikan ke layer GPU hanya sebentar sebelum & selama bergerak
            const rec = mv || (nt < vh * 1.6 && nt > -bury);
            if (rec !== f.rec) { f.rec = rec; L.fx.classList.toggle("is-receding", rec); }

            // tertutup penuh oleh section berikutnya
            const bur = nt <= -bury;
            if (bur !== f.bur) { f.bur = bur; L.el.classList.toggle("is-buried", bur); }
        }

        snap = false;
        if (moving) request(); else lastT = 0;
    }

    /* -------- nonaktif (prefers-reduced-motion) ---------- */
    function enable() {
        if (enabled) return;
        enabled = true; lastVh = 0;
        doc.style.setProperty("--vh", innerHeight + "px"); lastVh = innerHeight;
        doc.classList.add("js-stack");
        measure();
    }

    function disable() {
        enabled = false;
        cancelAnimationFrame(raf); raf = 0; lastT = 0;
        doc.classList.remove("js-stack");
        layers.forEach((L, i) => {
            const s = L.fx.style;
            s.transform = ""; s.transformOrigin = "";
            s.removeProperty("--dim"); s.removeProperty("--p");
            L.fx.classList.remove("is-receding");
            L.el.classList.remove("is-buried");
            if (i) L.el.style.top = "";
            cur[i] = 0; flag[i].rec = flag[i].bur = false;
        });
    }

    const sync = () => (mqReduce.matches ? disable() : enable());

    /* ---------- navigasi ke section ---------- */
    function indexOf(el) { return layers.findIndex((L) => L.el === el); }

    function goTo(el, behavior) {
        const i = indexOf(el);
        if (!enabled || i < 0) return false;
        scrollTo({ top: Math.max(0, Math.round(topY[i])), behavior });
        return true;
    }

    const nativeSIV = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (arg) {
        if (goTo(this, arg && arg.behavior === "smooth" ? "smooth" : "auto")) return;
        return nativeSIV.apply(this, arguments);
    };

    document.addEventListener("click", (e) => {
        if (!enabled || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = dec(a.getAttribute("href").slice(1));
        const el = id && document.getElementById(id);
        if (!el || !goTo(el, "smooth")) return;
        e.preventDefault();
        history.replaceState(null, "", "#" + id);
    });

    /* ---------- event ---------- */
    addEventListener("scroll", request, { passive: true });

    addEventListener("resize", () => {
        if (mqCoarse.matches && innerWidth === vw && Math.abs(innerHeight - vh) < 120) return;
        scheduleMeasure();
    });

    const ro = new ResizeObserver(scheduleMeasure);
    layers.forEach((L) => ro.observe(L.el));

    addEventListener("load", () => {
        scheduleMeasure();
        const id = dec(location.hash.slice(1));
        const el = id && document.getElementById(id);
        if (el) setTimeout(() => goTo(el, "auto"), 80);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);

    mqReduce.addEventListener("change", sync);

    window.ufStack = {
        top: (el) => (enabled && indexOf(el) >= 0 ? topY[indexOf(el)] : el.getBoundingClientRect().top + scrollY),
        refresh: measure,
    };

    sync();
})();