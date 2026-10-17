/* =====================================================================
   orbital-gallery.js - 3D Orbital Image Gallery (canvas transparan)
   ===================================================================== */
import * as THREE from "three";

/* ---------- ISI GALERI (ubah di sini) ---------- */
const ITEMS = [
    {
        img: "foto2.jpeg", nama: "Hidroponik", tag: "TANPA TANAH",
        ringkas: "Menanam dengan media air kaya nutrisi (AB Mix) tanpa tanah.",
        params: [["pH ideal", "5,5 - 6,5"], ["Tanaman cocok", "Selada, pakcoy, bayam, kangkung"], ["Teknik", "NFT, DFT, Wick"]],
        tips: ["Cek pH dan ppm secara berkala.", "Wick (sumbu) cocok untuk pemula."]
    },
    {
        img: "foto1.jpeg", nama: "Vertikultur", tag: "LAHAN SEMPIT",
        ringkas: "Bercocok tanam bertingkat ke atas memakai rak, pipa PVC, atau pot gantung.",
        params: [["Hemat lahan", "70 - 80%"], ["Tanaman cocok", "Strawberry, cabe rawit, tomat, sayuran daun"]],
        tips: ["Letakkan tanaman yang butuh cahaya penuh di tingkat atas."]
    },
    {
        img: "foto7.jpeg", nama: "Akuaponik", tag: "IKAN & TANAMAN",
        ringkas: "Budidaya ikan dan hidroponik dalam satu ekosistem tertutup.",
        params: [["Siklus", "Kotoran ikan diurai bakteri menjadi nutrisi"], ["Air", "Disaring tanaman, kembali bersih ke ikan"]],
        tips: ["Jaga keseimbangan jumlah ikan dan tanaman."]
    },
    {
        img: "foto3.jpeg", nama: "Hidroponik Botol", tag: "PANDUAN MANDIRI",
        ringkas: "Cara sederhana memulai hidroponik di rumah dengan alat dan bahan terjangkau.",
        params: [["Media tanam", "Rockwool"], ["Panen", "30 - 45 hari (sayur daun)"], ["Nutrisi", "AB Mix sesuai dosis ppm"]],
        tips: ["Semai di tempat gelap 1 - 2 hari, lalu kenalkan cahaya.", "Pindahkan bibit setelah 3 - 4 daun."]
    },
    {
        img: "foto2.jpeg", nama: "Greenhouse", tag: "LINGKUNGAN",
        ringkas: "Dashboard memantau larutan nutrisi, lingkungan greenhouse, dan kesehatan rak tanam.",
        params: [["Kelembapan udara", "Stabil sekitar 68%"], ["TDS", "Sekitar 840 ppm"]],
        tips: ["Kipas dan aerator menjaga sirkulasi udara dan oksigen air."]
    },
];

/* ---------- pengaturan ---------- */
const RADIUS = 4.4, CARD_W = 1.9, CARD_H = 1.425;   // kartu 4:3
const CAM_Z = 9, AUTO_SPEED = 0.12, SCROLL_TURNS = 1.25;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* peta alfa sudut membulat (dipakai bersama semua kartu) */
function roundedAlpha() {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192;
    const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 256, 192);
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(0, 0, 256, 192, 22); g.fill();
    return new THREE.CanvasTexture(c);
}

/* tekstur cadangan bila gambar tidak ada */
function placeholder(label) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 256, 192); gr.addColorStop(0, "#2a6a3c"); gr.addColorStop(1, "#123a22");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "600 20px sans-serif"; g.textAlign = "center"; g.fillText(label, 128, 100);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function initOrbitalGallery(root, items = ITEMS) {
    let renderer;
    const mobile = matchMedia("(pointer: coarse), (max-width: 800px)").matches;   // HP: hemat memori GPU
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: mobile ? "default" : "high-performance" }); }
    catch { root.classList.add("og-nogl"); return null; }
    renderer.setClearColor(0x000000, 0);                       // transparan: video latar tetap terlihat
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 2));
    renderer.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
    const cv = renderer.domElement;
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "Galeri 3D melayang: seret untuk memutar, klik foto untuk melihat materi");
    root.appendChild(cv);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    camera.position.set(0, 0, CAM_Z);
    const group = new THREE.Group();
    scene.add(group);

    /* ---------- kartu foto di bola (spiral Fibonacci, agak pipih) ---------- */
    const alpha = roundedAlpha(), loader = new THREE.TextureLoader(), cards = [];
    items.forEach((it, i) => {
        const n = items.length, y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), a = i * 2.399963;
        const home = new THREE.Vector3(Math.cos(a) * r * RADIUS, y * RADIUS * 0.55, Math.sin(a) * r * RADIUS);
        const mat = new THREE.MeshBasicMaterial({ map: placeholder(it.nama), alphaMap: alpha, transparent: true, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), mat);
        m.position.copy(home);
        m.userData = { item: it, home, o: 1, f: 0, tf: 0, focus: new THREE.Vector3(), fs: 1 };
        group.add(m); cards.push(m);
        loader.load(it.img, (t) => {                            // object-fit: cover
            t.colorSpace = THREE.SRGBColorSpace;
            const ia = t.image.width / t.image.height, ca = CARD_W / CARD_H;
            if (ia > ca) { t.repeat.set(ca / ia, 1); t.offset.set((1 - ca / ia) / 2, 0); }
            else { t.repeat.set(1, ia / ca); t.offset.set(0, (1 - ia / ca) / 2); }
            mat.map = t; mat.needsUpdate = true;
        }, undefined, () => { /* biarkan placeholder */ });
    });

    /* ---------- modal materi ---------- */
    const modal = el("div", "og-modal"); modal.hidden = true;
    const card = el("div", "og-card"); card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.tabIndex = -1;
    const x = el("button", "og-x", "Tutup \u2715"); x.type = "button"; x.setAttribute("aria-label", "Tutup detail");
    const tag = el("small", "og-tag"), h = el("h3", "og-h"), p = el("p", "og-p"), dl = el("dl", "og-dl"), tips = el("ul", "og-tips");
    h.id = "og-title"; card.setAttribute("aria-labelledby", "og-title");
    card.append(x, tag, h, p, dl, tips); modal.appendChild(card); document.body.appendChild(modal);

    /* daftar tombol tersembunyi untuk pengguna keyboard / pembaca layar */
    const sr = el("ul", "og-sr");
    items.forEach((it, i) => { const li = el("li"), b = el("button", null, "Buka materi: " + it.nama); b.type = "button"; b.addEventListener("click", () => select(cards[i])); li.appendChild(b); sr.appendChild(li); });
    root.appendChild(sr);

    let selected = null, lastFocus = null;

    function fill(it) {
        tag.textContent = it.tag; h.textContent = it.nama; p.textContent = it.ringkas;
        dl.replaceChildren(); tips.replaceChildren();
        it.params.forEach(([k, v]) => { const r = el("div"); r.append(el("dt", null, k), el("dd", null, v)); dl.appendChild(r); });
        it.tips.forEach((t) => tips.appendChild(el("li", null, t)));
    }

    function select(m) {
        if (selected === m) return;
        if (selected) selected.userData.tf = 0;
        selected = m; lastFocus = document.activeElement;
        // titik fokus di depan kamera (koordinat lokal grup); grup dibekukan selama fokus
        const hh = Math.tan(THREE.MathUtils.degToRad(22.5)) * 5.2, hw = hh * camera.aspect, wide = innerWidth > 800;
        const s = Math.min(1.8, (wide ? hw * 0.95 : hw * 1.8) / CARD_W);
        const w = new THREE.Vector3(wide ? -hw * 0.3 : 0, wide ? 0 : hh * 0.35, CAM_Z - 5.2);
        group.updateMatrixWorld(); m.userData.focus.copy(group.worldToLocal(w)); m.userData.fs = s;
        m.userData.tf = 1; fill(m.userData.item);
        modal.hidden = false; requestAnimationFrame(() => { modal.classList.add("open"); card.focus({ preventScroll: true }); });
        root.classList.add("og-focus");
    }

    function close() {
        if (!selected) return;
        selected.userData.tf = 0; selected = null;
        modal.classList.remove("open"); root.classList.remove("og-focus");
        setTimeout(() => { if (!selected) modal.hidden = true; }, 250);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    x.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (!card.contains(e.target)) close(); });   // klik di luar kartu
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    /* ---------- drag / sentuh / klik ---------- */
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let rot = 0, vel = 0, tilt = 0, tiltT = 0, scrollRot = 0, down = null, dragging = false, hover = null, hold = 0;
    const kick = (d, amt = 0.06) => { vel = clamp(vel + d * amt, -0.2, 0.2); };   // dorongan putar: d = -1 kiri, +1 kanan

    /* tombol putar kiri / kanan (tahan = terus berputar) */
    [[-1, "Putar ke kiri", "\u2039", "og-prev"], [1, "Putar ke kanan", "\u203A", "og-next"]].forEach(([d, label, glyph, cls]) => {
        const b = el("button", "og-nav " + cls, glyph); b.type = "button"; b.setAttribute("aria-label", label);
        b.addEventListener("pointerdown", () => { if (selected) return; hold = d; kick(d, 0.05); });
        b.addEventListener("click", (e) => { if (e.detail === 0 && !selected) kick(d); });   // Enter/Spasi dari keyboard
        root.appendChild(b);
    });
    const release = () => { hold = 0; };
    addEventListener("pointerup", release); addEventListener("pointercancel", release);

    // panah kiri/kanan saat galeri difokus; usap horizontal di trackpad
    root.tabIndex = 0;
    root.addEventListener("keydown", (e) => {
        if (selected || e.target !== root) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); kick(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); kick(1); }
    });
    cv.addEventListener("wheel", (e) => {
        if (selected || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // scroll vertikal tetap menggulir halaman
        e.preventDefault(); vel = clamp(vel - e.deltaX * 0.0004, -0.12, 0.12);
    }, { passive: false });

    function pick(e) {
        const r = cv.getBoundingClientRect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(cards, false).find((h) => h.object.userData.o > 0.35);   // abaikan kartu pudar di belakang
        return hit ? hit.object : null;
    }

    cv.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY }; dragging = false; });
    cv.addEventListener("pointermove", (e) => {
        if (down) {
            if (!dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { dragging = true; cv.setPointerCapture(e.pointerId); root.classList.add("og-drag"); }
            if (dragging && !selected) {
                const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
                rot += dx * 0.006; vel = dx * 0.006; tiltT = clamp(tiltT + dy * 0.004, -0.4, 0.4);
            }
            down.lx = e.clientX; down.ly = e.clientY;
        } else if (e.pointerType === "mouse") {
            const m = pick(e); if (m !== hover) { hover = m; cv.style.cursor = m ? "pointer" : "grab"; }
        }
    });
    const end = (e) => {
        if (!down) return;
        const wasDrag = dragging; down = null; dragging = false; root.classList.remove("og-drag");
        if (!wasDrag && e.type === "pointerup") { const m = pick(e); if (m && !selected) select(m); }
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);   // browser mengambil alih untuk scroll halaman

    /* ---------- ukuran & visibilitas ---------- */
    const resize = () => {
        const w = root.clientWidth, hgt = root.clientHeight; if (!w || !hgt) return;
        renderer.setSize(w, hgt, false); camera.aspect = w / hgt;
        camera.position.z = CAM_Z * (camera.aspect < 1 ? 1.35 : 1);   // layar sempit: mundurkan kamera
        camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(root); resize();

    let inView = true;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "120px" }).observe(root);
    const host = root.closest("section");   // stack.js menandai section tertutup dengan .is-buried


    /* ---------- loop ---------- */
    const tmp = new THREE.Vector3(), q = new THREE.Quaternion();
    let last = performance.now();

    renderer.setAnimationLoop((now) => {
        const idle = !inView || document.hidden || (host && host.classList.contains("is-buried"));
        if (idle) { last = now; return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now;

        if (!selected) {
            // putaran mengikuti scroll halaman (dihaluskan) + putaran otomatis + inersia drag
            const r = (host || root).getBoundingClientRect(), pr = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
            scrollRot += (pr * Math.PI * 2 * SCROLL_TURNS - scrollRot) * (1 - Math.exp(-dt * 5));
            if (hold) kick(hold, 0.004);
            if (!down) { rot += vel; vel *= 0.94; if (!reduceMotion) rot += AUTO_SPEED * dt; }
            tilt += (tiltT - tilt) * 0.1;
        }
        group.rotation.set(tilt, rot + scrollRot, 0);
        group.updateMatrixWorld();
        q.copy(group.quaternion).invert().multiply(camera.quaternion);   // kartu selalu menghadap kamera

        const kf = 1 - Math.exp(-dt * 8);
        for (const m of cards) {
            const u = m.userData;
            u.f += (u.tf - u.f) * kf; if (Math.abs(u.tf - u.f) < 0.001) u.f = u.tf;
            const e = ease(u.f);
            m.position.lerpVectors(u.home, u.focus, e);
            m.quaternion.copy(q);

            m.getWorldPosition(tmp);
            const depth = clamp((tmp.z + RADIUS) / (2 * RADIUS), 0, 1);       // 0 belakang, 1 depan
            const sc = (0.75 + 0.4 * depth) * (1 - e) + u.fs * e;
            m.scale.setScalar(sc);
            const target = selected ? (m === selected ? 1 : 0.1) : 0.2 + 0.8 * Math.pow(depth, 1.3) * (m === hover ? 1.15 : 1);
            u.o += (Math.min(1, target) - u.o) * kf;
            m.material.opacity = u.o;
            m.renderOrder = m === selected ? 10 : 0;
        }
        renderer.render(scene, camera);
    });

    return { select: (i) => select(cards[i]), close, destroy() { renderer.setAnimationLoop(null); renderer.dispose(); modal.remove(); cv.remove(); sr.remove(); } };
}

document.querySelectorAll("[data-orbital-gallery]").forEach((n) => {
    try {
        if (initOrbitalGallery(n)) console.info("[orbital-gallery] aktif");
    } catch (err) {                                   // tampilkan penyebab di halaman, bukan kotak kosong
        console.error("[orbital-gallery]", err);
        n.classList.add("og-err");
        n.textContent = "Galeri 3D gagal dimuat: " + err.message;
    }
});