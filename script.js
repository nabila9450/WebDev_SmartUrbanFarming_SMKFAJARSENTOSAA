import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ===== data.js =====
// Data informasi per jenis objek. Semua nilai adalah SIMULASI untuk edukasi.
const jitter = (base, range, digits = 1) =>
    +(base + (Math.random() - 0.5) * range).toFixed(digits);

const statusPH = (ph) => (ph < 5.5 ? "Terlalu asam" : ph > 6.5 ? "Terlalu basa" : "Ideal");

const NOTE = "Data simulasi untuk edukasi.";

// ===== penandaan otomatis dari nama objek Blender =====
const T = (info_type, nama, extra = {}) => ({ info_type, nama, ...extra });

const TAG_TABLE = {
    // tanaman
    padi: T("tanaman", "Padi"),
    tanaman_kubis: T("tanaman", "Kubis"),
    tanaman_sawi: T("tanaman", "Sawi"),
    tanaman_jagung: T("tanaman", "Jagung"),
    tanaman_cabai: T("tanaman", "Cabai"),
    selada: T("tanaman", "Selada"),
    selada_merah: T("tanaman", "Selada Merah"),
    selada_panen: T("tanaman", "Selada Siap Panen"),
    kangkung: T("tanaman", "Kangkung"),
    bayam: T("tanaman", "Bayam"),
    bibit: T("tanaman", "Bibit"),
    // pot net
    net_pot: T("pot", "Pot Net"),
    // jalur nutrisi
    pipa_nft: T("pipa", "Pipa NFT", { arah: "tanam" }),
    pipa: T("pipa", "Pipa"),
    siku: T("pipa", "Sambungan Siku"),
    kolar: T("pipa", "Kolar Pipa"),
    pipa_utama: T("pipa", "Pipa Utama", { arah: "masuk" }),
    pipa_pompa_naik: T("pipa", "Pipa Pompa Naik", { arah: "masuk" }),
    riser: T("pipa", "Riser", { arah: "masuk" }),
    manifold: T("pipa", "Manifold", { arah: "masuk" }),
    return_belakang: T("pipa", "Pipa Balik", { arah: "balik" }),
    return_lantai: T("pipa", "Pipa Balik", { arah: "balik" }),
    return_tandon: T("pipa", "Pipa Balik ke Tandon", { arah: "balik" }),
    kolektor: T("pipa", "Kolektor", { arah: "balik" }),
    // sensor
    probe_ph: T("sensor", "Probe pH", { parameter: "ph" }),
    probe_ec: T("sensor", "Probe EC", { parameter: "ec" }),
    sensor_klimat: T("sensor", "Sensor Iklim"),
    // tangki, pompa, lampu
    tandon_1000L: T("tangki", "Tandon 1000 L"),
    drum_nutrisi: T("tangki", "Drum Nutrisi"),
    drum_cadangan: T("tangki", "Drum Cadangan"),
    motor_pompa: T("pompa", "Motor Pompa"),
    rumah_pompa: T("pompa", "Rumah Pompa"),
    led_rak: T("lampu", "LED Rak"),
    led_langit: T("lampu", "LED Langit"),
    kepala_lampu: T("lampu", "Kepala Lampu"),
    lampu_semai: T("lampu", "Lampu Semai"),
};

// Objek lain: dicocokkan lewat potongan nama. Aturan paling atas menang.
const UMUM_RULES = [
    [/kaca/, "Kaca greenhouse", "Meneruskan cahaya matahari ke tanaman dan melindungi dari hujan"],
    [/kipas|grill|ventilasi/, "Ventilasi", "Mengatur sirkulasi udara dan suhu di dalam greenhouse"],
    [/panel|layar|kabinet|breaker|tombol/, "Kelistrikan & kontrol", "Mengatur dan memantau perangkat modul"],
    [/filter|katup|misting|downpipe|gorong|drainase|parit/, "Aliran air", "Mengatur, menyaring, atau membuang aliran air"],
    [/semai/, "Penyemaian", "Area menyemai benih sebelum dipindah ke rak"],
    [/panen|crate|keranjang|troli/, "Panen", "Peralatan untuk memanen dan menampung hasil"],
    [/simpan|lemari/, "Penyimpanan", "Menyimpan alat dan bahan kebun"],
    [/lampu/, "Pencahayaan", "Penopang dan pelindung lampu grow light"],
    [/tandon|drum/, "Tandon nutrisi", "Bagian dari penampung larutan nutrisi"],
    [/pompa/, "Pompa", "Bagian dari sistem pompa larutan"],
    [/rumput|bukit|pohon|palem|pakis|hosta|liriope|semak|tuft|batu|kerikil|paving|jalan|air_sawah|pematang|bedeng|orang_sawah|gubuk|pot_taman/, "Lanskap", "Pelengkap lingkungan kebun di sekitar modul"],
];

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function tagFromName(raw) {
    const key = raw.replace(/\.\d+$/, "").replace(/_?\d+$/, ""); 
    if (TAG_TABLE[key]) return TAG_TABLE[key];
    const rule = UMUM_RULES.find(([re]) => re.test(key));
    return {
        info_type: "umum",
        nama: cap(key.replace(/_/g, " ")),
        subtitle: rule ? rule[1] : "Struktur",
        fungsi: rule ? rule[2] : "Rangka dan penopang modul",
    };
}

function tagModel(root) {
    root.traverse((o) => {
        if (o === root) return;
        const raw = (o.userData && o.userData.name) || o.name;
        if (!raw) return;
        if (o.userData.info_type) return;
        Object.assign(o.userData, tagFromName(raw));
    });
}

// ===== warna material =====
const WARNA = {
    Air_Irigasi: { warna: 0x4aa8d8, alpha: 0.65, kasar: 0.03, metal: 0 },
    Rangka_Alu_Hitam: { warna: 0x2b2d2f },
    Jerami_Atap: { warna: 0xc9a85a },
    Rak_Baja_Hitam: { warna: 0x33363a },
    Batu_Kali_Abu: { warna: 0x8d9094 },
    Batu_Kali_Krem: { warna: 0xc9bb9d },
    Batu_Kali_Gelap: { warna: 0x5f6165 },
    Daun_Bayam: { warna: 0x2f8f3a },
    Batang_Sayur: { warna: 0x8fbf5a },
    Tanah_Subur: { warna: 0x4a3322 },
    Daun_Selada: { warna: 0x7cc243 },
    Daun_Kering: { warna: 0xa98a4a },
    Panel_Abu: { warna: 0x8a8f94 },
    Krom: { warna: 0xd5d8dc, metal: 0.9, kasar: 0.15 },
    Bukit_Hijau: { warna: 0x5c9a46 },
    Crate_Biru: { warna: 0x2f6fc4 },
    Pipa_PVC_Putih: { warna: 0xf2f2ee },
    Tandon_Biru: { warna: 0x2d6fbe },
    Kaca_Hydrophobic: { warna: 0xbfe3f0, alpha: 0.22, metal: 0, kasar: 0.05 },
    Beton: { warna: 0xb4b4b0 },
    Baja_Stainless: { warna: 0xc8ccd0, metal: 0.9, kasar: 0.25 },
    Kerikil_Lantai: { warna: 0xa89f91 },
    Daun_Hosta: { warna: 0x4f9a5a },
    Jalan_Tanah: { warna: 0x9a7b55 },
    Kotak_Kontrol_Putih: { warna: 0xeeeeee },
    Daun_Kangkung: { warna: 0x3fa84a },
    Counter_Abu: { warna: 0x9aa0a5 },
    Kayu: { warna: 0x9a6b3f },
    Daun_Liriope: { warna: 0x4f9f4a },
    Kipas_Gelap: { warna: 0x2a2c2e },
    Pompa_Biru: { warna: 0x2a67c9 },
    Net_Pot_Hitam: { warna: 0x1d1f21 },
    Baju_Orang_Sawah: { warna: 0xc8473a },
    Daun_Padi: { warna: 0x8cc63f },
    Daun_Pakis: { warna: 0x3f9a4a },
    Daun_Palem: { warna: 0x2f8a3a },
    Kulit_Kayu: { warna: 0x6b4a30 },
    Paving_Batu: { warna: 0xb0a89c },
    Daun_Pohon_A: { warna: 0x4fa044 },
    Daun_Pohon_B: { warna: 0x3d8f3a },
    Daun_Pisang: { warna: 0x5bb04a },
    Batang_Pisang: { warna: 0x9bc25a },
    Pot_Taman: { warna: 0xc4693f },
    Rumput: { warna: 0x6dae4a },
    Rumput_Tuft: { warna: 0x7fbf55 },
    Daun_Selada_Merah: { warna: 0x9b2f4f },
    Semak: { warna: 0x3f8a3f },
    Daun_Cabai: { warna: 0x3a8f3a },
    Buah_Cabai: { warna: 0xd8321f },
    Daun_Jagung: { warna: 0x7fb83f },
    Kubis_Daun_Luar: { warna: 0x6fb06a },
    Kubis_Kepala: { warna: 0xb9dc8f },
    Daun_Sawi: { warna: 0x5fb04a },
    Tutup_Tandon: { warna: 0x23272b },
    // Lampu_Taman, LED_*, Layar_*, Tombol_Merah sengaja tidak ada
};

function warnai(mat) {
    const w = WARNA[mat.name];
    if (!w) return;
    if (w.warna !== undefined) mat.color.setHex(w.warna);
    if (w.metal !== undefined) mat.metalness = w.metal;
    if (w.kasar !== undefined) mat.roughness = w.kasar;
    if (w.alpha !== undefined) { mat.transparent = true; mat.opacity = w.alpha; mat.depthWrite = false; }
}

function getInfo(obj) {
    const u = obj.userData || {};
    const nama = u.nama || obj.name;
    const ph = jitter(6.0, 0.4, 1);
    const ec = jitter(1.8, 0.3, 1);
    const tk = u.tingkat ? ` - Tingkat ${u.tingkat}` : "";

    switch (u.info_type) {
        case "tanaman":
            return {
                title: `${nama}${tk}`,
                subtitle: "Tanaman",
                rows: [
                    ["Jenis", u.jenis || nama],
                    ["Kelembapan media", `${jitter(70, 8, 0)}%`],
                    ["Status", "Sehat"],
                    ["Nutrisi", "AB Mix (makro + mikro)"],
                ],
                note: NOTE,
            };
        case "pot":
            return {
                title: `${nama}${tk}`,
                subtitle: "Pot net",
                rows: [["Fungsi", "Menahan tanaman agar akarnya menyentuh aliran nutrisi"]],
                note: NOTE,
            };
        case "pipa": {
            const arah = {
                masuk: "Nutrisi masuk dari tangki",
                balik: "Sisa larutan kembali ke tangki",
                tanam: "Aliran tipis larutan (NFT)",
            }[u.arah] || "Penghantar larutan nutrisi";
            return {
                title: nama,
                subtitle: "Jalur nutrisi",
                rows: [
                    ["Arah aliran", arah],
                    ["Debit", `${jitter(1.5, 0.3, 1)} L/menit`],
                    ["EC nutrisi", `${ec} mS/cm`],
                    ["pH larutan", `${ph} (${statusPH(ph)})`],
                ],
                note: NOTE,
            };
        }
        case "sensor":
            if (u.parameter === "ph")
                return { title: nama, subtitle: "Sensor", rows: [["pH air", ph], ["Status", statusPH(ph)], ["Rentang ideal", "5,5 - 6,5"]], note: NOTE };
            if (u.parameter === "ec")
                return { title: nama, subtitle: "Sensor", rows: [["EC", `${ec} mS/cm`], ["Nutrisi", "AB Mix (larutan A & B)"]], note: NOTE };
            return { title: nama, subtitle: "Sensor", rows: [["Kelembapan", `${jitter(70, 8, 0)}%`], ["Status", "Normal"]], note: NOTE };
        case "tangki":
            return {
                title: nama,
                subtitle: "Penampung larutan",
                rows: [["pH", `${ph} (${statusPH(ph)})`], ["EC", `${ec} mS/cm`], ["Suhu air", `${jitter(25, 2, 1)} C`], ["Nutrisi", "AB Mix"]],
                note: NOTE,
            };
        case "pompa":
            return { title: nama, subtitle: "Pompa", rows: [["Status", "Menyala"], ["Fungsi", "Mengalirkan larutan dari tangki ke tiap tingkat"]], note: NOTE };
        case "lampu":
            return { title: nama, subtitle: "Pencahayaan", rows: [["Fungsi", "Cahaya tambahan untuk fotosintesis"]], note: NOTE };
        case "umum":
            return { title: nama, subtitle: u.subtitle, rows: [["Fungsi", u.fungsi]], note: NOTE };
        default:
            return { title: nama, subtitle: "Struktur", rows: [["Fungsi", "Rangka penopang modul"]], note: NOTE };
    }
}

// ===== ui.js =====
// Mengatur panel informasi.
const body = document.getElementById("panel-body");

const DEFAULT_TEXT = "Klik tanaman, pipa, tangki, atau sensor pada model untuk melihat informasinya.";

function clearInfo() {
    body.replaceChildren(Object.assign(document.createElement("p"), { textContent: DEFAULT_TEXT }));
}

function showInfo(info) {
    const h = Object.assign(document.createElement("h3"), { textContent: info.title });
    const sub = Object.assign(document.createElement("p"), { className: "sub", textContent: info.subtitle });
    const table = document.createElement("table");
    for (const [label, value] of info.rows) {
        const tr = table.insertRow();
        tr.insertCell().textContent = label;
        tr.insertCell().textContent = value;
    }
    const note = Object.assign(document.createElement("p"), { className: "note", textContent: info.note });
    body.replaceChildren(h, sub, table, note);
}

function showFallback(message) {
    const el = document.getElementById("fallback");
    el.textContent = message;
    el.hidden = false;
    document.getElementById("loader").hidden = true;
}

function hideLoader() {
    document.getElementById("loader").hidden = true;
}

// ===== viewer.js =====
// Scene Three.js: renderer, kamera, cahaya, OrbitControls (rotate + zoom), pemuat .glb.

function createViewer(container) {
    // HP: tanpa antialias dan pixel ratio dibatasi supaya tidak kehabisan memori GPU
    const mobile = matchMedia("(pointer: coarse), (max-width: 800px)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "default" }); // error jika WebGL tidak ada
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 2));
    container.appendChild(renderer.domElement);
    // Jika browser HP membuang konteks WebGL, jangan biarkan canvas jadi kosong tanpa kabar
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        const fb = document.getElementById("fallback");
        fb.textContent = "Tampilan 3D terhenti karena memori HP penuh. Tutup tab lain lalu muat ulang halaman.";
        fb.hidden = false;
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
        document.getElementById("fallback").hidden = true;
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
    const startPos = new THREE.Vector3(4.2, 2.6, 4.5);
    const startTarget = new THREE.Vector3(0, 1.1, 0);
    camera.position.copy(startPos);

    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9bb59f, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(4, 8, 5);
    scene.add(sun);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(startTarget);
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 30;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 1.2;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    const panMin = new THREE.Vector3(-60, 0, -60), panMax = new THREE.Vector3(60, 12, 60);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.autoRotateSpeed = 1.2;
    // OrbitControls memasang touch-action:none sehingga di HP halaman tidak bisa di-scroll saat jari di atas model.
    // pan-y: geser vertikal = scroll halaman, geser horizontal = putar model, dua jari = zoom.
    renderer.domElement.style.touchAction = "pan-y";
    controls.update();

    const viewer = { THREE, scene, camera, renderer, controls, root: null };

    function resize() {
        const w = container.clientWidth, h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(container);
    resize();

    // Hemat GPU: render hanya saat viewer terlihat, tab aktif, dan section-nya tidak tertutup section berikutnya
    // (class "is-buried" dipasang oleh stack.js)
    let inView = true;
    const host = container.closest("section");
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "160px" }).observe(container);

    renderer.setAnimationLoop(() => {
        if (!inView || document.hidden || (host && host.classList.contains("is-buried"))) return;
        controls.target.clamp(panMin, panMax); 
        controls.update();
        renderer.render(scene, camera);
    });

    viewer.load = async (url) => {
        const gltf = await new GLTFLoader().loadAsync(url);
        // Klon material per mesh agar highlight satu objek tidak ikut mewarnai objek lain.
        gltf.scene.traverse((o) => {
            if (!o.isMesh) return;
            o.material = o.material.clone();
            warnai(o.material);
            if (o.material.name === "Kaca_Hydrophobic") o.raycast = () => { }; 
        });
        tagModel(gltf.scene);
        scene.add(gltf.scene);
        viewer.root = gltf.scene;
        return gltf.scene;
    };

    viewer.resetView = () => {
        camera.position.copy(startPos);
        controls.target.copy(startTarget);
        controls.update();
    };

    viewer.setAutoRotate = (on) => { controls.autoRotate = on; };
    viewer.setPanMode = (on) => { controls.mouseButtons.LEFT = on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; controls.touches.ONE = on ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE; };

    return viewer;
}

// ===== interaction.js =====
// Hover, klik (raycast), dan highlight objek. Membaca userData hasil extras glTF dari Blender.
const HOVER = 0x1f5f35;
const SELECT = 0x2fbf5f;

function setupInteraction(viewer, { onSelect, onClear }) {
    const { THREE, camera, renderer } = viewer;
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dom = renderer.domElement;
    let hovered = null;
    let selected = null;
    let downX = 0, downY = 0;

    const findInfo = (o) => {
        while (o && !(o.userData && o.userData.info_type)) o = o.parent;
        return o;
    };

    function pick(e) {
        const r = dom.getBoundingClientRect();
        pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(pointer, camera);
        const hit = ray.intersectObjects(viewer.root.children, true)[0];
        return hit ? findInfo(hit.object) : null;
    }

    function glow(obj, color) {
        if (!obj) return;
        obj.traverse((m) => {
            if (!m.isMesh || !m.material || !m.material.emissive) return;
            if (!m.userData._emissive) m.userData._emissive = m.material.emissive.clone();
            if (color === null) m.material.emissive.copy(m.userData._emissive);
            else m.material.emissive.setHex(color);
        });
    }

    function refresh(obj) {
        glow(obj, obj === selected ? SELECT : obj === hovered ? HOVER : null);
    }

    dom.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const obj = pick(e);
        if (obj === hovered) return;
        const prev = hovered;
        hovered = obj;
        refresh(prev);
        refresh(obj);
        dom.style.cursor = obj ? "pointer" : "grab";
    });

    dom.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; });

    dom.addEventListener("pointerup", (e) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; 
        const obj = pick(e);
        const prev = selected;
        selected = obj;
        refresh(prev);
        refresh(obj);
        if (obj) onSelect(obj);
        else onClear();
    });

    return { getSelected: () => selected };
}

// ===== main.js =====

// Dicoba berurutan, jadi tetap jalan walau file .glb ada di folder yang sama dengan index.html
const MODEL_URLS = ["assets/models/urban_farm.glb", "models/urban_farm.glb", "urban_farm.glb"];

async function init() {
    clearInfo();

    let viewer;
    try {
        viewer = createViewer(document.getElementById("viewer"));
    } catch (err) {
        showFallback("Browser kamu belum mendukung WebGL, jadi model 3D tidak bisa ditampilkan.");
        return;
    }

    try {
        let lastErr;
        for (const url of MODEL_URLS) {
            try { await viewer.load(url); lastErr = null; break; } catch (err) { lastErr = err; }
        }
        if (lastErr) throw lastErr;
    } catch (err) {
        console.error(err);
        showFallback("Model belum bisa dimuat. Pastikan file urban_farm.glb ada (assets/models/ atau satu folder dengan index.html) dan website dibuka lewat server/hosting, bukan langsung dari file.");
        return;
    }
    hideLoader();

    const inter = setupInteraction(viewer, {
        onSelect: (obj) => showInfo(getInfo(obj)),
        onClear: clearInfo,
    });

    // Nilai simulasi diperbarui tiap 2 detik selama objek terpilih
    setInterval(() => {
        const sel = inter.getSelected();
        if (sel) showInfo(getInfo(sel));
    }, 2000);

    document.getElementById("btn-reset").addEventListener("click", viewer.resetView);
    const pan = document.getElementById("btn-pan");
    pan.addEventListener("click", () => {
        const on = pan.getAttribute("aria-pressed") !== "true";
        pan.setAttribute("aria-pressed", String(on));
        viewer.setPanMode(on);
    });
    const rot = document.getElementById("btn-rotate");
    rot.addEventListener("click", () => {
        const on = rot.getAttribute("aria-pressed") !== "true";
        rot.setAttribute("aria-pressed", String(on));
        viewer.setAutoRotate(on);
    });
}

init();

// ===== effects.js =====
// Efek landing: preloader, gambar placeholder, nav adaptif, hero bertahap saat scroll,
// parallax mouse, reveal, dan teks yang menyala per kata.
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Preloader
addEventListener("load", () => setTimeout(() => $("#pre").classList.add("done"), 900));

// Gambar: pasang jika file ada, kalau tidak tampilkan placeholder berlabel nama file
document.querySelectorAll("[data-img]").forEach((el) => {
    const src = el.dataset.img, img = new Image();
    img.onload = () => (el.style.backgroundImage = `url(${src})`);
    img.onerror = () => el.classList.add("ph");
    img.src = src;
});

// Reveal saat masuk layar
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
document.querySelectorAll(".rv").forEach((el) => io.observe(el));

// Teks per kata
const words = $("#words");
words.innerHTML = words.textContent.split(" ").map((w) => `<span>${w}</span>`).join(" ");
const spans = [...words.children];

const nav = $("#nav"), hero = $("#hero"), sc1 = $(".sc1"), sc2 = $(".sc2"), fls = $(".fls");
const secs = [...document.querySelectorAll("[data-theme]")];

function onScroll() {
    // Hero: scene 1 memudar, scene 2 muncul
    const p = clamp(scrollY / (hero.offsetHeight - innerHeight));
    sc1.style.opacity = 1 - clamp(p / 0.35);
    sc1.style.transform = `translateY(${-p * 80}px)`;
    sc2.style.opacity = clamp((p - 0.3) / 0.3);
    sc2.style.transform = `scale(${1 + (1 - clamp((p - 0.3) / 0.7)) * 0.08})`;
    let cur = null;
    for (const s of secs) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) cur = s; }
    let theme = cur ? cur.dataset.theme : "dark";
    // Scene 2 memakai latar foto yang digelapkan, jadi navbar tetap putih (tema "dark")
    nav.dataset.t = theme;
    // Kata menyala
    const r = words.getBoundingClientRect();
    const k = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3));
    spans.forEach((s, i) => s.classList.toggle("on", i < k * spans.length));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Parallax mouse pada objek melayang
addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    fls.style.transform = `translate(${x * -30}px, ${y * -20}px)`;
});

// Kartu metode: klik / Enter untuk buka-tutup detail
document.querySelectorAll(".mcard").forEach((c) => {
    const toggle = () => { c.classList.toggle("open"); c.setAttribute("aria-expanded", c.classList.contains("open")); };
    c.addEventListener("click", toggle);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
});