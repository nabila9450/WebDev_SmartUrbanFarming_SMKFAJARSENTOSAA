// ===== features.js =====
// 4 fitur tambahan Urban Farm. Berdiri sendiri: tidak menyentuh script.js (Three.js) maupun dashboard.js.
// Elemen HTML disisipkan lewat JS, jadi index.html cukup memuat file ini.
(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const solusi = $("#solusi");
    const dashMain = $("#solusi .dash-main");
    if (!solusi || !dashMain) return;

    const pad = (n) => String(n).padStart(2, "0");
    const nowStr = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

    // ---------- Toast ----------
    const toastEl = document.createElement("div");
    toastEl.className = "fx-toast";
    toastEl.setAttribute("role", "status");
    document.body.appendChild(toastEl);
    let toastTimer;
    function toast(msg, warn = false) {
        toastEl.textContent = msg;
        toastEl.classList.toggle("warn", warn);
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
    }

    // ---------- State sensor simulasi (dipakai fitur 1 & 3) ----------
    const state = { tds: 840, ph: 6.2, temp: 24, pump: true, light: true, fan: true };
    const LIMIT = { tdsMin: 800, phMin: 5.5, phMax: 6.5, tempMax: 26 };

    // ---------- Sisipkan HTML ----------
    dashMain.querySelector(".dash-note").insertAdjacentHTML("beforebegin", `
    <div class="fx-row">
        <div class="dbox" id="fx-ctrl">
            <h4>Kontrol Perangkat <span>simulasi</span></h4>
            <div class="fx-switch"><div><b>Pompa Air / Nutrisi</b><small>Mengalirkan larutan ke rak</small></div>
                <span class="fx-state on" data-for="pump">ON</span>
                <button class="fx-toggle" type="button" role="switch" aria-checked="true" aria-label="Pompa Air / Nutrisi" data-dev="pump"></button></div>
            <div class="fx-switch"><div><b>Grow Light LED</b><small>Cahaya tambahan fotosintesis</small></div>
                <span class="fx-state on" data-for="light">ON</span>
                <button class="fx-toggle" type="button" role="switch" aria-checked="true" aria-label="Grow Light LED" data-dev="light"></button></div>
            <div class="fx-switch"><div><b>Kipas / Aerator</b><small>Sirkulasi udara dan oksigen air</small></div>
                <span class="fx-state on" data-for="fan">ON</span>
                <button class="fx-toggle" type="button" role="switch" aria-checked="true" aria-label="Kipas atau Aerator" data-dev="fan"></button></div>
        </div>
        <div class="dbox" id="fx-logbox">
            <h4>Notifikasi Log Sistem <button class="fx-clear" type="button" id="fx-clear">BERSIHKAN</button></h4>
            <ul class="fx-log" id="fx-log" aria-live="polite"></ul>
        </div>
    </div>`);

    solusi.insertAdjacentHTML("beforeend", `
    <div class="fx-grid">
        <div class="fx-card" id="fx-calc">
            <h3>Kalkulator Nutrisi AB Mix</h3>
            <p>Hitung berapa mL Nutrisi A dan B untuk satu tangki.</p>
            <form class="fx-form" id="fx-calc-form" novalidate>
                <label class="wide">JENIS TANAMAN
                    <select id="fx-plant">
                        <option value="800">Selada</option>
                        <option value="1050">Pakcoy</option>
                        <option value="1000">Bayam</option>
                        <option value="1050">Kangkung</option>
                        <option value="1400">Cabai</option>
                    </select></label>
                <label>DOSIS TARGET
                    <input id="fx-target" type="number" min="0" step="any" value="800" inputmode="decimal"></label>
                <label>SATUAN
                    <select id="fx-unit"><option value="ppm">ppm</option><option value="ec">EC (mS/cm)</option></select></label>
                <label class="wide">VOLUME AIR TANGKI (LITER)
                    <input id="fx-vol" type="number" min="0" step="any" value="50" inputmode="decimal"></label>
                <button class="talk lime" type="submit">HITUNG <i>&#8599;</i></button>
            </form>
            <div class="fx-result" id="fx-result" aria-live="polite"></div>
        </div>
        <div class="fx-card" id="fx-journal">
            <h3>Jurnal Tanam Mandiri</h3>
            <p>Catatanmu tersimpan di browser ini (localStorage).</p>
            <form class="fx-form" id="fx-j-form">
                <label class="wide">NAMA TANAMAN
                    <input id="fx-j-name" type="text" maxlength="60" required placeholder="Contoh: Selada rak 1"></label>
                <label>TANGGAL TANAM
                    <input id="fx-j-plant" type="date" required></label>
                <label>ESTIMASI PANEN
                    <input id="fx-j-harv" type="date" required></label>
                <label class="wide">CATATAN TAMBAHAN
                    <textarea id="fx-j-note" rows="2" maxlength="300" placeholder="pH, nutrisi, kondisi daun..."></textarea></label>
                <button class="talk lime" type="submit">TAMBAH CATATAN <i>+</i></button>
            </form>
            <ul class="fx-list" id="fx-j-list"></ul>
        </div>
    </div>`);

    // ---------- FITUR 3: log & peringatan ----------
    const logEl = $("#fx-log");
    const MAX_LOG = 30;
    function addLog(text, type = "") {
        const li = document.createElement("li");
        if (type) li.className = type;
        const t = document.createElement("time"); t.textContent = nowStr();
        const s = document.createElement("span"); s.textContent = text;
        li.append(t, s);
        logEl.prepend(li);
        while (logEl.children.length > MAX_LOG) logEl.lastElementChild.remove();
    }
    $("#fx-clear").addEventListener("click", () => { logEl.replaceChildren(); addLog("Log dibersihkan", "ok"); });

    const alerted = { tds: false, ph: false, temp: false };
    function checkThresholds() {
        const { tds, ph, temp } = state;
        if (tds < LIMIT.tdsMin && !alerted.tds) {
            alerted.tds = true;
            addLog(`⚠️ Nutrisi TDS turun di bawah threshold (${Math.round(tds)} ppm < ${LIMIT.tdsMin})`, "warn");
            toast("⚠️ TDS di bawah batas aman", true);
        } else if (tds >= LIMIT.tdsMin + 20 && alerted.tds) {
            alerted.tds = false;
            addLog(`🟢 TDS kembali normal (${Math.round(tds)} ppm)`, "ok");
        }
        if ((ph < LIMIT.phMin || ph > LIMIT.phMax) && !alerted.ph) {
            alerted.ph = true;
            addLog(`⚠️ pH di luar rentang ideal (${ph.toFixed(1)})`, "warn");
            toast("⚠️ pH di luar rentang ideal", true);
        } else if (ph >= LIMIT.phMin + 0.1 && ph <= LIMIT.phMax - 0.1 && alerted.ph) {
            alerted.ph = false;
            addLog(`🟢 pH kembali ideal (${ph.toFixed(1)})`, "ok");
        }
        if (temp > LIMIT.tempMax && !alerted.temp) {
            alerted.temp = true;
            addLog(`⚠️ Suhu air tinggi (${temp.toFixed(1)}°C)`, "warn");
            toast("⚠️ Suhu air melewati 26°C", true);
        } else if (temp <= LIMIT.tempMax - 0.5 && alerted.temp) {
            alerted.temp = false;
            addLog(`🟢 Suhu air kembali normal (${temp.toFixed(1)}°C)`, "ok");
        }
    }

    // Tampilkan nilai ke kartu KPI (setelah animasi hitung angka selesai)
    let kpiReady = false;
    const kpiVals = dashMain.querySelectorAll(".kpi strong");
    function paintKpi() {
        if (!kpiReady || kpiVals.length < 3) return;
        kpiVals[0].textContent = `${state.temp.toFixed(0)}°C`;
        kpiVals[1].textContent = state.ph.toFixed(1);
        kpiVals[2].textContent = `${Math.round(state.tds)} ppm`;
    }
    const dashEl = $("#dash");
    if (dashEl) {
        const w = new MutationObserver(() => {
            if (dashEl.classList.contains("in")) { setTimeout(() => { kpiReady = true; paintKpi(); }, 1500); w.disconnect(); }
        });
        w.observe(dashEl, { attributes: true, attributeFilter: ["class"] });
    }

    const rnd = (a, b) => a + Math.random() * (b - a);
    function tick() {
        // Pompa mati -> nutrisi menurun; pompa menyala -> cenderung kembali ke ~870 ppm
        state.tds += state.pump ? (870 - state.tds) * 0.25 + rnd(-8, 8) : rnd(-30, -12);
        state.ph += (6.2 - state.ph) * 0.2 + rnd(-0.08, 0.08) + (state.pump ? 0 : 0.05);
        // Kipas mati -> suhu naik pelan; menyala -> turun ke ~24
        state.temp += state.fan ? (24 - state.temp) * 0.3 + rnd(-0.2, 0.2) : rnd(0.2, 0.6);
        state.tds = Math.max(500, Math.min(1100, state.tds));
        state.ph = Math.max(4.8, Math.min(7.4, state.ph));
        state.temp = Math.max(20, Math.min(32, state.temp));
        paintKpi();
        checkThresholds();
    }
    setInterval(tick, 4000);

    // Log awal
    addLog(`Suhu air normal (${state.temp}°C)`, "ok");
    addLog(`pH larutan ideal (${state.ph})`, "ok");
    addLog("🟢 Otomatisasi pompa aktif", "ok");

    // ---------- FITUR 1: kontrol perangkat ----------
    const NAMES = { pump: "Pompa Air / Nutrisi", light: "Grow Light LED", fan: "Kipas / Aerator" };
    $("#fx-ctrl").addEventListener("click", (e) => {
        const btn = e.target.closest(".fx-toggle");
        if (!btn) return;
        const k = btn.dataset.dev, on = btn.getAttribute("aria-checked") !== "true";
        state[k] = on;
        btn.setAttribute("aria-checked", String(on));
        const st = $(`.fx-state[data-for="${k}"]`);
        st.textContent = on ? "ON" : "OFF";
        st.classList.toggle("on", on);
        toast(`✅ Perintah terkirim: ${NAMES[k]} ${on ? "ON" : "OFF"}`);
        addLog(`${on ? "🟢" : "🔴"} ${NAMES[k]} ${on ? "dinyalakan" : "dimatikan"} (perintah manual)`, on ? "ok" : "");
    });

    // ---------- FITUR 2: kalkulator AB Mix ----------
    // Asumsi umum: 5 mL A + 5 mL B per 1 liter air ≈ 1200 ppm. Ubah BASE_PPM sesuai label produkmu.
    const BASE_PPM = 1200, BASE_ML = 5, EC_TO_PPM = 500;
    const plant = $("#fx-plant"), target = $("#fx-target"), unit = $("#fx-unit"), vol = $("#fx-vol"), res = $("#fx-result");

    plant.addEventListener("change", () => { unit.value = "ppm"; target.value = plant.value; });
    unit.addEventListener("change", () => {
        const ppm = parseFloat(plant.value);
        target.value = unit.value === "ec" ? (ppm / EC_TO_PPM).toFixed(1) : ppm;
    });
    $("#fx-calc-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const t = parseFloat(target.value), v = parseFloat(vol.value);
        if (!(t > 0) || !(v > 0)) { res.textContent = "Isi dosis target dan volume dengan angka lebih dari 0."; return; }
        const ppm = unit.value === "ec" ? t * EC_TO_PPM : t;
        const ml = (ppm / BASE_PPM) * BASE_ML * v;
        const fmt = (n) => n >= 100 ? Math.round(n) : n.toFixed(1);
        res.innerHTML = `<div><small>NUTRISI A</small><strong>${fmt(ml)} mL</strong></div>
            <div class="b"><small>NUTRISI B</small><strong>${fmt(ml)} mL</strong></div>
            <p class="fx-note">Target ${Math.round(ppm)} ppm untuk ${v} L (${plant.options[plant.selectedIndex].text}). Larutkan A dan B terpisah, jangan dicampur pekat. Estimasi; cek takaran di label produkmu.</p>`;
        toast("✅ Perhitungan nutrisi selesai");
    });
    $("#fx-calc-form").requestSubmit();

    // ---------- FITUR 4: jurnal tanam (localStorage) ----------
    const KEY = "urbanfarm_jurnal";
    const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(d) ? d : []; } catch { return []; } };
    const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { toast("Gagal menyimpan: penyimpanan browser tidak tersedia", true); return false; } };
    const listEl = $("#fx-j-list");
    const fmtDate = (s) => { const d = new Date(s + "T00:00:00"); return isNaN(d) ? s : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); };
    const daysLeft = (s) => Math.ceil((new Date(s + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 864e5);

    function render() {
        const data = load();
        listEl.replaceChildren();
        if (!data.length) {
            const p = document.createElement("li"); p.className = "fx-empty"; p.style.border = "0";
            p.textContent = "Belum ada catatan. Tambahkan tanaman pertamamu.";
            listEl.appendChild(p); return;
        }
        data.forEach((it) => {
            const li = document.createElement("li");
            const box = document.createElement("div");
            const b = document.createElement("b"); b.textContent = it.nama;
            const sm = document.createElement("small");
            const d = daysLeft(it.panen);
            sm.textContent = `Tanam ${fmtDate(it.tanam)} • Panen ${fmtDate(it.panen)} • ` + (d > 0 ? `${d} hari lagi` : d === 0 ? "panen hari ini" : "lewat estimasi panen");
            box.append(b, sm);
            if (it.catatan) { const p = document.createElement("p"); p.textContent = it.catatan; box.appendChild(p); }
            const del = document.createElement("button");
            del.type = "button"; del.className = "del"; del.textContent = "HAPUS"; del.dataset.id = it.id;
            del.setAttribute("aria-label", `Hapus catatan ${it.nama}`);
            li.append(box, del);
            listEl.appendChild(li);
        });
    }
    $("#fx-j-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const nama = $("#fx-j-name").value.trim(), tanam = $("#fx-j-plant").value, panen = $("#fx-j-harv").value;
        if (!nama || !tanam || !panen) { toast("Lengkapi nama, tanggal tanam, dan estimasi panen", true); return; }
        if (panen < tanam) { toast("Estimasi panen tidak boleh sebelum tanggal tanam", true); return; }
        const data = load();
        data.unshift({ id: Date.now().toString(36), nama, tanam, panen, catatan: $("#fx-j-note").value.trim() });
        if (!save(data)) return;
        e.target.reset();
        render();
        toast("✅ Catatan jurnal ditambahkan");
        addLog(`📓 Jurnal baru: ${nama}`, "ok");
    });
    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".del");
        if (!btn) return;
        if (!save(load().filter((x) => x.id !== btn.dataset.id))) return;
        render();
        toast("Catatan dihapus");
    });
    render();
})();