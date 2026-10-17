/* =====================================================================
   ph-slider.js - penanda pH pada kartu
   ===================================================================== */
(() => {
    const card = document.querySelector(".k3.phm");
    if (!card) return;
    const sc = card.querySelector(".sc"), num = card.querySelector(".num"), badge = card.querySelector(".top em"), ft = card.querySelector(".ft");
    if (!sc || !num || !badge || !ft || !num.firstChild) return;

    const MAX = 14, DEF = 6.0, LO = 5.5, HI = 6.5;     // skala 0-14, rentang ideal sayuran daun 5,5 - 6,5
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const fmt = (v) => v.toFixed(1).replace(".", ",");
    const defaultNote = ft.textContent;
    let value = DEF;

    /* ---------- gaya ---------- */
    const st = document.createElement("style");
    st.textContent = `
    .phm .sc{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
    .phm .sc::before{content:"";position:absolute;inset:-16px 0}
    .phm .sc.drag{cursor:grabbing}
    .phm .sc .mk{cursor:grab}
    .phm .sc.touched .mk{transition:left .18s ease-out}
    .phm .sc.drag .mk{transition:none}
    .phm .sc:focus-visible{outline:2px solid var(--lime,#b9f45c);outline-offset:8px}
    .phm .num{transition:color .2s}
    .phm.is-off .num{color:#ffb4a8}
    .phm .ok.warn{background:#ffb4a8;color:#5a1208}
    .ph-hint{display:flex;justify-content:space-between;align-items:center;gap:.6rem;margin-top:.1rem;font:400 .6rem "Space Mono",monospace;opacity:.85}
    .ph-reset{border:1px solid rgba(255,255,255,.4);background:none;color:#fff;font:700 .58rem "Space Mono",monospace;padding:.3rem .6rem;border-radius:99px;cursor:pointer}
    .ph-reset:hover,.ph-reset:focus-visible{background:var(--lime,#b9f45c);color:var(--ink,#0b0f0d);border-color:transparent}
    .ph-reset[hidden]{display:none}`;
    document.head.appendChild(st);

    /* petunjuk + tombol atur ulang */
    const hint = document.createElement("div");
    hint.className = "ph-hint";
    const hintText = document.createElement("span");
    hintText.textContent = "Geser penanda untuk mencoba nilai pH";
    const reset = document.createElement("button");
    reset.type = "button"; reset.className = "ph-reset"; reset.textContent = "Atur ulang"; reset.hidden = true;
    hint.append(hintText, reset);
    sc.parentNode.querySelector(".ticks").after(hint);

    /* ---------- aksesibilitas ---------- */
    sc.tabIndex = 0;
    sc.setAttribute("role", "slider");
    sc.setAttribute("aria-label", "Nilai pH");
    sc.setAttribute("aria-valuemin", "0");
    sc.setAttribute("aria-valuemax", String(MAX));

    /* ---------- tampilkan nilai ---------- */
    function render(v) {
        const off = v < LO || v > HI;
        sc.style.setProperty("--x", (v / MAX) * 100 + "%");
        num.firstChild.nodeValue = fmt(v);                       // hanya teks angka, <small>pH</small> tetap
        badge.textContent = v < LO ? "Terlalu asam" : v > HI ? "Terlalu basa" : "Ideal";
        badge.classList.toggle("warn", off);
        card.classList.toggle("is-off", off);
        ft.textContent = v < LO ? `pH ${fmt(v)} terlalu asam: naikkan pelan-pelan dengan pH Up.`
            : v > HI ? `pH ${fmt(v)} terlalu basa: turunkan dengan pH Down. Pada pH ini, besi dan kalsium sulit diserap akar.`
                : (v === DEF ? defaultNote : `pH ${fmt(v)} ada di rentang ideal sayuran daun (5,5 sampai 6,5).`);
        sc.setAttribute("aria-valuenow", String(v));
        sc.setAttribute("aria-valuetext", `pH ${fmt(v)}, ${badge.textContent}`);
        reset.hidden = v === DEF;
    }

    function set(v) {
        value = clamp(Math.round(v * 10) / 10, 0, MAX);
        sc.classList.add("touched");
        render(value);
    }

    const fromX = (cx) => { const r = sc.getBoundingClientRect(); return clamp((cx - r.left) / r.width, 0, 1) * MAX; };

    /* ---------- geser / klik ---------- */
    sc.addEventListener("pointerdown", (e) => {
        if (e.button) return;
        e.preventDefault();
        sc.setPointerCapture(e.pointerId);
        sc.classList.add("drag");
        sc.focus({ preventScroll: true });
        set(fromX(e.clientX));
    });
    sc.addEventListener("pointermove", (e) => { if (sc.hasPointerCapture(e.pointerId)) set(fromX(e.clientX)); });
    const stop = (e) => { sc.classList.remove("drag"); if (sc.hasPointerCapture(e.pointerId)) sc.releasePointerCapture(e.pointerId); };
    sc.addEventListener("pointerup", stop);
    sc.addEventListener("pointercancel", stop);

    /* ---------- keyboard ---------- */
    sc.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 0.5 : 0.1;
        const next = { ArrowLeft: value - step, ArrowDown: value - step, ArrowRight: value + step, ArrowUp: value + step, Home: 0, End: MAX }[e.key];
        if (next === undefined) return;
        e.preventDefault(); set(next);
    });

    reset.addEventListener("click", () => set(DEF));

    render(value);   // pasang atribut aria awal
})();