// ===== revisi.js =====
// (2) Modal artikel interaktif untuk 3 kartu berita, (3) Auto-Presentation Mode dengan floating control bar.
// Berdiri sendiri: tidak menyentuh script.js (Three.js), dashboard.js, maupun features.js.
(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fmt = (n) => String(n).replace(".", ",");

    /* =============== 2. ARTIKEL =============== */
    const tabs = (items) => `<div class="tb" data-tabs>
        <div class="tb-h" role="tablist">${items.map((t, i) => `<button type="button" role="tab" class="${i ? "" : "on"}" data-tab="${i}" aria-selected="${!i}">${t[0]}</button>`).join("")}</div>
        ${items.map((t, i) => `<div class="tb-p" role="tabpanel" data-pan="${i}" ${i ? "hidden" : ""}>${t[1]}</div>`).join("")}</div>`;
    const slider = (label, name, min, max, step, val, unit) =>
        `<label><span>${label}</span><output></output><input type="range" name="${name}" min="${min}" max="${max}" step="${step}" value="${val}" data-u="${unit}"></label>`;

    const CROPS = [["Selada", 5.5, 6.5, 600, 800], ["Pakcoy", 5.5, 6.5, 800, 1050], ["Bayam", 6.0, 7.0, 900, 1000], ["Kangkung", 5.5, 6.5, 850, 1050], ["Cabai", 6.0, 6.5, 1200, 1400]];
    const cropRows = CROPS.map(([n, a, b, p1, p2]) => `<tr><td><b>${n}</b></td><td>${fmt(a.toFixed(1))}–${fmt(b.toFixed(1))}</td><td>${p1}–${p2}</td><td>${fmt((p1 / 500).toFixed(1))}–${fmt((p2 / 500).toFixed(1))}</td><td><div class="bar"><i style="width:${p2 / 15}%"></i></div></td></tr>`).join("");

    const ART = {
        nft: {
            tag: "EDUKASI · OKT 2026", title: "Dasar Hidroponik NFT untuk Pemula", next: "ph",
            lead: "NFT (Nutrient Film Technique) mengalirkan lapisan tipis larutan nutrisi terus-menerus di dasar talang, sehingga akar menyerap nutrisi sekaligus tetap mendapat oksigen.",
            body: `<h3>Langkah membangun sistem NFT</h3>
            ${tabs([
                ["1 Bak", "<p>Siapkan bak nutrisi (tandon atau ember tertutup, 50–100 L) agar air tidak berlumut. Pasang pompa celup kecil dan aerator, lalu isi air dan larutan AB Mix.</p>"],
                ["2 Talang", "<p>Susun talang atau pipa PVC berlubang di rak. Jarak lubang tanam sekitar 15–20 cm untuk sayuran daun. Beri kemiringan landai supaya air mengalir sendiri.</p>"],
                ["3 Tanam", "<p>Pindahkan bibit yang sudah berdaun 3–4 helai (di rockwool) ke netpot, lalu letakkan di lubang talang. Ujung akar harus menyentuh aliran air.</p>"],
                ["4 Aliran", "<p>Sambungkan selang dari pompa ke ujung atas talang. Ujung bawah talang mengalir kembali ke bak (sistem resirkulasi). Atur debit sampai air membentuk lapisan tipis.</p>"],
                ["5 Rawat", "<p>Cek pH dan ppm setiap hari, tambah air saat volume turun, ganti larutan tiap 1–2 minggu, dan bersihkan talang dari lumut.</p>"]
            ])}
            <h3>Hitung kemiringan pipa dan debit air</h3>
            <p>Geser nilainya dan lihat hasilnya. Angka acuan umum: kemiringan sekitar 1,5–3,5% dan debit 1–2 liter per menit per talang.</p>
            <div class="cl" data-calc="nft">
                ${slider("Panjang talang", "len", 1, 12, .5, 6, " m")}${slider("Kemiringan", "slope", .5, 5, .5, 2, "%")}
                ${slider("Jumlah talang", "n", 1, 20, 1, 8, " talang")}${slider("Debit per talang", "q", .5, 3, .1, 1.5, " L/mnt")}
                <div class="rs"><div><small>BEDA TINGGI UJUNG</small><strong data-o="drop"></strong></div><div><small>DEBIT POMPA MINIMAL</small><strong data-o="flow"></strong></div><div><small>VOLUME PER JAM</small><strong data-o="hour"></strong></div></div>
                <div class="msg" data-o="msg" aria-live="polite"></div>
            </div>
            <h3>Kelebihan dan kekurangan</h3>
            ${tabs([
                ["Kelebihan", "<ul><li>Hemat air karena larutan disirkulasikan ulang.</li><li>Akar mendapat banyak oksigen, pertumbuhan cepat.</li><li>Bersih dan mudah dipanen, cocok untuk lahan sempit.</li><li>Sangat cocok untuk sayuran daun seperti selada dan pakcoy.</li></ul>"],
                ["Kekurangan", "<ul><li>Bergantung pada listrik dan pompa: pompa mati, akar cepat kering.</li><li>Biaya awal lebih tinggi daripada sistem sumbu (wick).</li><li>Penyakit mudah menyebar karena larutan dipakai bersama.</li><li>Perlu pemantauan pH dan ppm rutin; kurang cocok untuk tanaman besar.</li></ul>"]
            ])}
            <p class="note" style="margin-top:1rem">Angka di atas adalah acuan umum; sesuaikan dengan panjang talang, jenis tanaman, dan kondisi di kebunmu.</p>`
        },
        ph: {
            tag: "EDUKASI · OKT 2026", title: "Cara Membaca pH dan EC Larutan", next: "urban",
            lead: "pH menunjukkan tingkat keasaman larutan (skala 0–14). EC (daya hantar listrik) menunjukkan seberapa pekat nutrisinya; ppm adalah angka perkiraan yang sebanding dengan EC.",
            body: `<h3>Coba penguji pH</h3>
            <p>Geser untuk melihat apa yang harus dilakukan pada nilai pH tertentu.</p>
            <div class="cl" data-calc="ph">
                ${slider("pH larutan", "ph", 3, 10, .1, 6, "")}
                <div><div class="sc" style="background:linear-gradient(90deg,#e5483b,#f08a2c 20%,#f2d230 35%,#8fd13f 45%,#2fae5b 55%,#1f9bb5 75%,#3b5fd0)"><i class="band" style="left:35.7%;width:14.3%"></i><i class="mk"></i></div><div class="ticks"><span>3 asam</span><span>5,5–6,5 ideal</span><span>10 basa</span></div></div>
                <div class="msg" data-o="msg" aria-live="polite"></div>
            </div>
            <h3>pH ideal, ppm, dan EC per tanaman</h3>
            <div class="tbl-wrap"><table class="tt"><thead><tr><th>TANAMAN</th><th>pH</th><th>PPM</th><th>EC (mS/cm)</th><th>KEPEKATAN</th></tr></thead><tbody>${cropRows}</tbody></table></div>
            <p class="note" style="margin-top:.5rem">Konversi di sini: EC 1,0 mS/cm ≈ 500 ppm. Sebagian alat memakai faktor 640 atau 700, jadi cek skala alatmu.</p>
            <h3>Cara menaikkan atau menurunkan pH</h3>
            ${tabs([
                ["Naikkan pH", "<ol><li>Ukur dulu pH larutan dengan alat yang sudah dikalibrasi.</li><li>Tambahkan larutan <b>pH Up</b> sedikit demi sedikit sesuai petunjuk di label.</li><li>Aduk, tunggu 10–15 menit, lalu ukur ulang.</li><li>Ulangi bila perlu. Hindari mengubah lebih dari 0,5 poin sekaligus.</li></ol>"],
                ["Turunkan pH", "<ol><li>Ukur dulu pH larutan.</li><li>Tambahkan larutan <b>pH Down</b> (asam, misalnya berbahan asam fosfat) setetes demi setetes. Pakai sarung tangan dan kacamata.</li><li>Aduk, tunggu 10–15 menit, lalu ukur ulang.</li><li>Ulangi sampai masuk rentang ideal tanamanmu.</li></ol>"]
            ])}
            <div class="box"><b>Tips:</b> kalibrasi pH meter secara berkala memakai larutan buffer pH 4 dan pH 7, dan ukur pH setelah nutrisi dicampur.</div>`
        },
        urban: {
            tag: "PROYEK · OKT 2026", title: "Tentang Urban Farm", next: "nft",
            lead: "Urban Farm adalah platform edukasi dan produksi mandiri yang membantu orang kota menanam sayur hidroponik dengan bantuan sensor dan data.",
            body: `<h3>Visi</h3>
            <div class="box">Pangan segar dan mandiri bisa tumbuh di lahan sesempit apa pun di kota, lewat sains yang bisa dipahami semua orang.</div>
            <h3>Misi</h3>
            <ul><li>Mengajarkan hidroponik dari dasar dengan materi yang mudah dipraktikkan.</li><li>Mendorong produksi pangan mandiri di rumah, balkon, dan atap.</li><li>Mengukur kondisi tanaman dengan sensor, bukan menebak-nebak.</li><li>Menyajikan data secara transparan agar keputusan bisa ditelusuri.</li></ul>
            <h3>Teknologi smart farming berbasis data sains</h3>
            ${tabs([
                ["Sensor", "<p>Sensor pH, EC/TDS, suhu air, dan kelembapan mengukur kondisi larutan dan lingkungan secara berkala.</p>"],
                ["Data", "<p>Setiap pembacaan dicatat sehingga tren naik atau turun bisa dilihat, misalnya penurunan nutrisi (TDS) dari hari ke hari.</p>"],
                ["Analisis", "<p>Nilai dibandingkan dengan ambang batas (misalnya pH 5,5–6,5). Bila keluar batas, sistem memberi peringatan lebih awal sebelum tanaman terganggu.</p>"],
                ["Otomasi", "<p>Pompa, grow light, dan kipas dapat dikontrol berdasarkan jadwal atau pembacaan sensor, sehingga perawatan lebih ringan.</p>"]
            ])}
            <p class="note" style="margin-top:.8rem">Data pada dashboard di situs ini adalah simulasi untuk demonstrasi.</p>
            <div class="row2"><button type="button" data-go="#eksplor">LIHAT MODEL 3D</button><button type="button" data-go="#solusi">BUKA DASHBOARD</button></div>`
        }
    };
    const NAMES = { nft: "Dasar Hidroponik NFT untuk Pemula", ph: "Cara Membaca pH dan EC Larutan", urban: "Tentang Urban Farm" };

    const calcs = {
        nft(c) {
            const v = (n) => +$(`[name=${n}]`, c).value, L = v("len"), s = v("slope"), n = v("n"), q = v("q");
            const set = (k, t) => ($(`[data-o=${k}]`, c).textContent = t);
            set("drop", `${fmt((L * s).toFixed(1))} cm`); set("flow", `${fmt((n * q).toFixed(1))} L/mnt`); set("hour", `${Math.round(n * q * 60)} L`);
            const w = [];
            if (s < 1.5) w.push("Kemiringan terlalu landai: air bisa menggenang di talang.");
            if (s > 3.5) w.push("Kemiringan terlalu curam: air lewat terlalu cepat, akar bisa kekurangan nutrisi.");
            if (q < 1 || q > 2) w.push("Debit di luar acuan 1–2 L/menit per talang.");
            if (L > 10) w.push("Talang lebih dari 10 m: ujung hilir bisa kekurangan oksigen dan nutrisi.");
            const m = $("[data-o=msg]", c); m.classList.toggle("warn", !!w.length);
            m.textContent = w.length ? w.join(" ") : "Pengaturan ada di rentang acuan umum. Pilih pompa dengan debit sedikit di atas angka minimal.";
        },
        ph(c) {
            const v = +$("[name=ph]", c).value, m = $("[data-o=msg]", c);
            $(".mk", c).style.setProperty("--x", `${((v - 3) / 7) * 100}%`); $(".mk", c).style.left = `${((v - 3) / 7) * 100}%`;
            const bad = v < 5.5 || v > 6.5;
            m.classList.toggle("warn", bad);
            m.textContent = v < 5.5 ? `pH ${fmt(v.toFixed(1))}: terlalu asam. Naikkan pelan-pelan dengan pH Up.`
                : v > 6.5 ? `pH ${fmt(v.toFixed(1))}: terlalu basa. Turunkan dengan pH Down. Pada pH ini, besi dan kalsium sulit diserap akar.`
                    : `pH ${fmt(v.toFixed(1))}: ideal untuk sebagian besar sayuran daun. Pertahankan dan ukur lagi besok.`;
        }
    };
    const syncOut = (c) => $$("input[type=range]", c).forEach((i) => ($("output", i.parentNode).textContent = fmt(i.value) + (i.dataset.u || "")));

    const modal = document.createElement("div");
    modal.className = "am";
    modal.innerHTML = `<div class="am-p" role="dialog" aria-modal="true" aria-labelledby="am-t" tabindex="-1">
        <div class="am-hd"><span id="am-k"></span><button type="button" class="am-x" aria-label="Tutup artikel">TUTUP ✕</button><div class="am-bar"><i></i></div></div>
        <article class="am-c" id="am-b"></article></div>`;
    document.body.appendChild(modal);
    const panel = $(".am-p", modal), body = $("#am-b", modal), prog = $(".am-bar i", modal);
    let lastFocus = null, current = "";

    function openArt(key, from) {
        const a = ART[key]; if (!a) return;
        current = key; if (from) lastFocus = from;
        $("#am-k", modal).textContent = a.tag;
        body.innerHTML = `<h2 id="am-t">${a.title}</h2><p class="lead">${a.lead}</p>${a.body}
            <div class="row2"><button type="button" data-art="${a.next}">BACA BERIKUTNYA: ${NAMES[a.next]} →</button></div>`;
        $$("[data-calc]", body).forEach((c) => { syncOut(c); calcs[c.dataset.calc](c); });
        modal.classList.add("open"); document.documentElement.classList.add("am-lock");
        panel.scrollTop = 0; prog.style.width = "0"; panel.focus();
    }
    function closeArt() {
        modal.classList.remove("open"); document.documentElement.classList.remove("am-lock");
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    $$(".news[data-art]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openArt(a.dataset.art, a); }));

    modal.addEventListener("click", (e) => {
        const t = e.target;
        if (t === modal || t.closest(".am-x")) return closeArt();
        const tab = t.closest("[data-tab]");
        if (tab) {
            const box = tab.closest("[data-tabs]");
            $$("[data-tab]", box).forEach((b) => { const on = b === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
            $$("[data-pan]", box).forEach((p) => (p.hidden = p.dataset.pan !== tab.dataset.tab));
            return;
        }
        const go = t.closest("[data-go]");
        if (go) { closeArt(); lastFocus = null; $(go.dataset.go).scrollIntoView({ behavior: "smooth" }); return; }
        const nx = t.closest("[data-art]");
        if (nx) openArt(nx.dataset.art);
    });
    modal.addEventListener("input", (e) => { const c = e.target.closest("[data-calc]"); if (c) { syncOut(c); calcs[c.dataset.calc](c); } });
    panel.addEventListener("scroll", () => { prog.style.width = `${(panel.scrollTop / Math.max(1, panel.scrollHeight - panel.clientHeight)) * 100}%`; }, { passive: true });
    modal.addEventListener("keydown", (e) => {   // fokus dikunci di dalam dialog
        if (e.key !== "Tab") return;
        const f = $$("button, input, [tabindex=\"0\"]", panel).filter((x) => !x.closest("[hidden]"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* =============== 3. MODE PRESENTASI OTOMATIS =============== */
    const DWELL = 5000, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ico = { prev: "M6 6h2v12H6zM20 6v12L10 12z", play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zM14 5h4v14h-4z", next: "M16 6h2v12h-2zM4 6v12l10-6z", x: "M6 6l12 12M18 6L6 18" };
    const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    const bar = document.createElement("div");
    bar.id = "pbar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Kontrol presentasi");
    bar.innerHTML = `<button type="button" data-p="prev" aria-label="Bagian sebelumnya">${svg(ico.prev)}</button>
        <button type="button" data-p="play" aria-label="Jeda">${svg(ico.pause)}</button>
        <button type="button" data-p="next" aria-label="Bagian berikutnya">${svg(ico.next)}</button>
        <span class="st" aria-live="polite"></span>
        <button type="button" class="x" data-p="exit" aria-label="Keluar mode presentasi">${svg(ico.x)}</button>`;
    const pprog = document.createElement("div"); pprog.id = "pprog";
    document.body.append(bar, pprog);

    const P = { on: false, play: false, i: 0, raf: 0, to: 0 };
    const secs = () => $$("body > section");
    // Section sticky punya posisi layar yang berubah-ubah; stack.js menyediakan posisi "natural" di dokumen.
    const topOf = (s) => (window.ufStack ? window.ufStack.top(s) : s.getBoundingClientRect().top + scrollY);
    const halt = () => { cancelAnimationFrame(P.raf); clearTimeout(P.to); };

    function upd() {
        const n = secs().length, b = $("[data-p=play]", bar);
        $(".st", bar).textContent = `${P.i + 1} / ${n}`;
        b.innerHTML = svg(P.play ? ico.pause : ico.play);
        b.setAttribute("aria-label", P.play ? "Jeda" : "Putar");
        pprog.style.width = `${((P.i + 1) / n) * 100}%`;
    }
    function next() { if (P.i >= secs().length - 1) { P.play = false; halt(); upd(); return; } go(P.i + 1); }
    function go(i) {
        const S = secs(); P.i = Math.max(0, Math.min(S.length - 1, i));
        halt(); upd();
        const s = S[P.i], idx = P.i, y0 = topOf(s);
        scrollTo({ top: y0, behavior: reduce ? "instant" : "smooth" });
        if (!P.play) return;
        P.to = setTimeout(() => {
            const d = topOf(s) + s.offsetHeight - innerHeight - y0;   // jarak yang masih bisa digulir di dalam section
            if (d < 40) { P.to = setTimeout(next, DWELL); return; }
            const dur = Math.min(16000, Math.max(5000, d * 9)), t0 = performance.now();
            const f = (t) => {
                if (!P.play || P.i !== idx) return;
                const k = Math.min(1, (t - t0) / dur);
                scrollTo({ top: y0 + d * k, behavior: "instant" });
                if (k < 1) P.raf = requestAnimationFrame(f); else P.to = setTimeout(next, 1200);
            };
            P.raf = requestAnimationFrame(f);
        }, reduce ? 300 : 1300);
    }
    function pause() { if (!P.on || !P.play) return; P.play = false; halt(); upd(); }
    function toggle() { P.play = !P.play; P.play ? go(P.i) : (halt(), upd()); }
    function start() { P.on = true; P.play = true; document.body.classList.add("pres"); go(0); $("[data-p=play]", bar).focus({ preventScroll: true }); }
    function exit() { halt(); P.on = P.play = false; document.body.classList.remove("pres"); }

    bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-p]"); if (!b) return;
        const a = b.dataset.p;
        if (a === "play") toggle();
        else if (a === "next") go(P.i + 1);
        else if (a === "prev") go(P.i - 1);
        else exit();
    });
    // Pengguna menggulir sendiri -> presentasi dijeda (bukan dihentikan)
    addEventListener("wheel", pause, { passive: true });
    addEventListener("touchstart", pause, { passive: true });
    addEventListener("keydown", (e) => {
        if (e.key === "Escape") { if (modal.classList.contains("open")) closeArt(); else if (P.on) exit(); return; }
        if (!P.on || modal.classList.contains("open")) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(P.i + 1); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(P.i - 1); }
        else if (e.key === " " && !e.target.closest("button, input, select, textarea, a")) { e.preventDefault(); toggle(); }
    });
    const btn = $("#btn-present"); if (btn) btn.addEventListener("click", start);
})();