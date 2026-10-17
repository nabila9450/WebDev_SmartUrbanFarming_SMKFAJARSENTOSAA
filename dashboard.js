// ===== Dashboard Solusi =====
(() => {
    const NS = "http://www.w3.org/2000/svg";
    const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
    const dash = document.getElementById("dash");
    if (!dash) return;

    // Line chart + area + tooltip
    (function tds() {
        const box = document.getElementById("c-tds"), svg = box.querySelector("svg"), tip = box.querySelector(".tip");
        const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
        const data = [820, 900, 870, 940, 890, 840, 860].map((v, i) => [820, 900, 870, 940, 890, 880, 840][i]);
        const W = 560, H = 190, L = 34, R = 10, T = 14, B = 24, mn = 700, mx = 1000;
        const x = (i) => L + (i * (W - L - R)) / (data.length - 1);
        const y = (v) => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
        [700, 800, 900, 1000].forEach((g) => {
            el("line", { x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: "#e3ebe4" }, svg);
            el("text", { x: L - 6, y: y(g) + 3, "text-anchor": "end" }, svg).textContent = g;
        });
        const pts = data.map((v, i) => [x(i), y(v)]);
        el("path", { d: `M${pts.map((p) => p.join(",")).join("L")}L${x(data.length - 1)},${H - B}L${x(0)},${H - B}Z`, fill: "#dff3dc", opacity: .8 }, svg);
        const line = el("path", { d: `M${pts.map((p) => p.join(",")).join("L")}`, fill: "none", stroke: "#123a22", "stroke-width": 2, "stroke-linejoin": "round" }, svg);
        labels.forEach((l, i) => el("text", { x: x(i), y: H - 6, "text-anchor": "middle" }, svg).textContent = l);
        const dot = el("circle", { r: 4.5, fill: "#123a22", stroke: "#fff", "stroke-width": 2, opacity: 0 }, svg);
        const guide = el("line", { y1: T, y2: H - B, stroke: "#123a22", "stroke-dasharray": "3 3", opacity: 0 }, svg);
        const len = line.getTotalLength ? line.getTotalLength() : 0;
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        dash._drawTds = () => { line.style.transition = "stroke-dashoffset 1.4s ease"; line.style.strokeDashoffset = 0; };
        const show = (i) => {
            dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(data[i])); dot.setAttribute("opacity", 1);
            guide.setAttribute("x1", x(i)); guide.setAttribute("x2", x(i)); guide.setAttribute("opacity", .6);
            const r = svg.getBoundingClientRect(), br = box.getBoundingClientRect();
            tip.textContent = `${labels[i]}: ${data[i]} ppm`;
            tip.style.left = (r.left - br.left + (x(i) / W) * r.width) + "px";
            tip.style.top = (r.top - br.top + (y(data[i]) / H) * r.height) + "px";
            tip.style.opacity = 1;
        };
        svg.addEventListener("pointermove", (e) => {
            const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
            show(Math.max(0, Math.min(data.length - 1, Math.round(((px - L) / (W - L - R)) * (data.length - 1)))));
        });
        svg.addEventListener("pointerleave", () => { tip.style.opacity = 0; dot.setAttribute("opacity", 0); guide.setAttribute("opacity", 0); });
        show(3); // tooltip awal seperti contoh
    })();

    // Donut
    (function donut() {
        const svg = document.getElementById("c-donut");
        const parts = [[14, "#123a22"], [7, "#4cb82e"], [3, "#b9f45c"]], total = 24, r = 46, c = 2 * Math.PI * r;
        el("circle", { cx: 60, cy: 60, r, fill: "none", stroke: "#eef1ee", "stroke-width": 16 }, svg);
        let off = 0;
        parts.forEach(([v, col]) => {
            const l = (v / total) * c;
            el("circle", { cx: 60, cy: 60, r, fill: "none", stroke: col, "stroke-width": 16, "stroke-dasharray": `${l - 1.5} ${c - l + 1.5}`, "stroke-dashoffset": -off, transform: "rotate(-90 60 60)" }, svg);
            off += l;
        });
    })();

    // pH & suhu (dua garis, suhu putus-putus)
    (function ph() {
        const svg = document.querySelector("#c-ph svg");
        const W = 560, H = 150, L = 10, R = 10, T = 10, B = 22;
        const phv = [6.1, 6.3, 6.2, 6.0, 6.4, 6.2, 6.3, 6.1, 6.2, 6.3, 6.2, 6.2];
        const tv = [23, 23.5, 24, 25, 25.5, 25, 24.5, 24, 23.5, 23.5, 24, 24];
        const mk = (arr, mn, mx) => arr.map((v, i) => [L + (i * (W - L - R)) / (arr.length - 1), T + (1 - (v - mn) / (mx - mn)) * (H - T - B)]);
        const d = (p) => "M" + p.map((q) => q.join(",")).join("L");
        el("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, stroke: "#e3ebe4" }, svg);
        el("path", { d: d(mk(tv, 21, 27)), fill: "none", stroke: "#4cb82e", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
        el("path", { d: d(mk(phv, 5.6, 6.6)), fill: "none", stroke: "#123a22", "stroke-width": 2 }, svg);
        ["00:00", "06:00", "12:00", "18:00", "24:00"].forEach((l, i) => el("text", { x: L + (i * (W - L - R)) / 4, y: H - 6, "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle" }, svg).textContent = l);
    })();

    // Bar segmen
    (function bars() {
        const wrap = document.getElementById("c-bars"), n = 24, on = Math.round(n * 0.85);
        for (let i = 0; i < n; i++) {
            const s = document.createElement("span");
            if (i >= on) s.className = "on-l";
            s.style.transitionDelay = i * 25 + "ms";
            wrap.appendChild(s);
        }
    })();

    // Animasi saat masuk layar + hitung angka
    const count = () => dash.querySelectorAll("[data-count]").forEach((n) => {
        const to = parseFloat(n.dataset.count), dec = +n.dataset.dec || 0, suf = n.dataset.suf || "", t0 = performance.now();
        const f = (t) => { const k = Math.min(1, (t - t0) / 1100); n.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(f); };
        requestAnimationFrame(f);
    });
    const io2 = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { dash.classList.add("in"); dash._drawTds && dash._drawTds(); count(); io2.disconnect(); }
    }), { threshold: 0.25 });
    io2.observe(dash);
})();