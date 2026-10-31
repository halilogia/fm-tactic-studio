"use strict";
/**
 * FM Universal Scout - Excel-Like Data Grid, Column Filtering, Save Loader & Player Modal Controller
 */
let scoutSortBy = "pa";
let scoutSortOrder = "desc";
let scoutPageOffset = 0;
const SCOUT_PAGE_LIMIT = 100;
let scoutTotalCount = 0;
let scoutWonderkidsOnly = false;
let scoutDebounceTimer = null;
let scoutInitialized = false;
async function initScoutModule() {
    if (scoutInitialized)
        return;
    scoutInitialized = true;
    await fetchAvailableSaves();
    await queryScoutPlayers(0);
}
async function fetchAvailableSaves() {
    const selectEl = document.getElementById("scoutSaveSelect");
    const statusBadge = document.getElementById("scoutSaveStatusBadge");
    if (!selectEl)
        return;
    try {
        const res = await fetch("/api/saves");
        const data = await res.json();
        const saves = data.saves || [];
        if (saves.length === 0) {
            selectEl.innerHTML = `<option value="">Kayıtlı .fm dosyası bulunamadı (Dosya Seç ile yükleyin)</option>`;
        }
        else {
            selectEl.innerHTML = saves.map((s) => `
        <option value="${s.id}">[${s.version_guess}] ${s.filename} (${s.size_mb} MB)</option>
      `).join("");
        }
        if (data.is_loaded && data.active_save && statusBadge) {
            statusBadge.innerText = `${data.active_save.file_name} • ${(data.active_save.total_players || 0).toLocaleString("tr-TR")} Oyuncu`;
            statusBadge.className = "bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[11px] px-2.5 py-0.5 rounded-full font-mono";
        }
    }
    catch (err) {
        console.error("Save listesi alınamadı:", err);
    }
}
async function loadSelectedSaveFile() {
    const selectEl = document.getElementById("scoutSaveSelect");
    const customPathEl = document.getElementById("scoutCustomPathInput");
    const statusBadge = document.getElementById("scoutSaveStatusBadge");
    const loadBtn = document.getElementById("scoutLoadSaveBtn");
    const customPath = customPathEl && customPathEl.value.trim() ? customPathEl.value.trim() : "";
    const saveRef = customPath || (selectEl ? selectEl.value : "");
    if (!saveRef) {
        alert("Lütfen listeden bir .fm kaydı seçin veya dosya yükleyin.");
        return;
    }
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Yükleniyor...`;
    }
    if (statusBadge) {
        statusBadge.innerText = "Save ayrıştırılıyor (fmsave)...";
    }
    try {
        const res = await fetch("/api/load-save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ save_ref: saveRef })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Kayıt yüklenemedi");
        }
        if (statusBadge && data.save_info) {
            statusBadge.innerText = `${data.save_info.file_name} • ${(data.total_players || 0).toLocaleString("tr-TR")} Oyuncu`;
        }
        await queryScoutPlayers(0);
    }
    catch (err) {
        alert("Kayıt dosyası okuma hatası: " + (err.message || err));
    }
    finally {
        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.innerHTML = `<i class="fa-solid fa-database mr-1"></i> Kaydı Yükle`;
        }
    }
}
async function handleSaveFileUpload(event) {
    const input = event.target;
    if (!input.files || input.files.length === 0)
        return;
    const file = input.files[0];
    const statusBadge = document.getElementById("scoutSaveStatusBadge");
    if (statusBadge) {
        statusBadge.innerText = `${file.name} yükleniyor ve taranıyor...`;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch("/api/upload-save", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.detail || "Yükleme başarısız");
        await fetchAvailableSaves();
        await queryScoutPlayers(0);
    }
    catch (err) {
        alert("FM Save yükleme hatası: " + (err.message || err));
    }
}
function getFilterVal(id, fallback = "") {
    const el = document.getElementById(id);
    return el ? el.value.trim() : fallback;
}
function buildScoutQueryParams(offsetVal) {
    const params = new URLSearchParams();
    params.set("query", getFilterVal("scoutGlobalSearch"));
    params.set("name_filter", getFilterVal("colFilterName"));
    params.set("club_filter", getFilterVal("colFilterClub"));
    params.set("nation_filter", getFilterVal("colFilterNation"));
    params.set("position", getFilterVal("colFilterPos"));
    params.set("min_age", getFilterVal("colFilterMinAge", "14") || "14");
    params.set("max_age", getFilterVal("colFilterMaxAge", "50") || "50");
    params.set("min_ca", getFilterVal("colFilterMinCA", "0") || "0");
    params.set("min_pa", getFilterVal("colFilterMinPA", "0") || "0");
    params.set("min_consistency", getFilterVal("colFilterMinCons", "0") || "0");
    params.set("min_important_matches", getFilterVal("colFilterMinImp", "0") || "0");
    params.set("max_injury_proneness", getFilterVal("colFilterMaxInj", "20") || "20");
    params.set("min_versatility", getFilterVal("colFilterMinVers", "0") || "0");
    params.set("min_ambition", getFilterVal("colFilterMinAmb", "0") || "0");
    params.set("min_professionalism", getFilterVal("colFilterMinProf", "0") || "0");
    params.set("min_pressure", getFilterVal("colFilterMinPres", "0") || "0");
    params.set("wonderkids_only", String(scoutWonderkidsOnly));
    params.set("sort_by", scoutSortBy);
    params.set("sort_order", scoutSortOrder);
    params.set("limit", String(SCOUT_PAGE_LIMIT));
    params.set("offset", String(offsetVal));
    return params;
}
function triggerScoutFilterDebounced() {
    if (scoutDebounceTimer) {
        window.clearTimeout(scoutDebounceTimer);
    }
    scoutDebounceTimer = window.setTimeout(() => {
        queryScoutPlayers(0);
    }, 160);
}
function toggleWonderkidsFilter() {
    scoutWonderkidsOnly = !scoutWonderkidsOnly;
    const btn = document.getElementById("btnWonderkidsToggle");
    if (btn) {
        if (scoutWonderkidsOnly) {
            btn.className = "px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 border border-amber-300 shadow-md transition";
        }
        else {
            btn.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
        }
    }
    queryScoutPlayers(0);
}
function resetScoutFilters() {
    const ids = [
        "scoutGlobalSearch", "colFilterName", "colFilterClub", "colFilterNation", "colFilterPos",
        "colFilterMinAge", "colFilterMaxAge", "colFilterMinCA", "colFilterMinPA",
        "colFilterMinCons", "colFilterMinImp", "colFilterMaxInj", "colFilterMinVers",
        "colFilterMinAmb", "colFilterMinProf", "colFilterMinPres"
    ];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el)
            el.value = "";
    });
    scoutWonderkidsOnly = false;
    const btn = document.getElementById("btnWonderkidsToggle");
    if (btn) {
        btn.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
    }
    queryScoutPlayers(0);
}
function sortScoutColumn(col) {
    if (scoutSortBy === col) {
        scoutSortOrder = scoutSortOrder === "desc" ? "asc" : "desc";
    }
    else {
        scoutSortBy = col;
        scoutSortOrder = col === "injury_proneness" || col === "age" || col === "name" ? "asc" : "desc";
    }
    updateSortHeaderIcons();
    queryScoutPlayers(0);
}
function updateSortHeaderIcons() {
    document.querySelectorAll("[data-sort-col]").forEach((el) => {
        const col = el.getAttribute("data-sort-col");
        const indicator = el.querySelector(".sort-indicator");
        if (!indicator)
            return;
        if (col === scoutSortBy) {
            indicator.textContent = scoutSortOrder === "asc" ? " ▲" : " ▼";
            indicator.className = "sort-indicator text-cyan-400 font-bold";
        }
        else {
            indicator.textContent = " ⇅";
            indicator.className = "sort-indicator text-slate-600";
        }
    });
}
function formatAbilityBadge(val) {
    if (val >= 170)
        return `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold font-mono">${val}</span>`;
    if (val >= 150)
        return `<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold font-mono">${val}</span>`;
    if (val >= 130)
        return `<span class="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold font-mono">${val}</span>`;
    return `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${val}</span>`;
}
function formatHiddenStat(val, inverseGood = false) {
    if (inverseGood) {
        // Injury proneness or dirtiness: low is good (green), high is bad (red)
        if (val <= 6)
            return `<span class="text-emerald-400 font-bold font-mono">${val}</span>`;
        if (val >= 14)
            return `<span class="text-rose-400 font-bold font-mono">${val}</span>`;
        return `<span class="text-slate-300 font-mono">${val}</span>`;
    }
    if (val >= 15)
        return `<span class="text-emerald-400 font-bold font-mono">${val}</span>`;
    if (val >= 12)
        return `<span class="text-cyan-300 font-semibold font-mono">${val}</span>`;
    if (val <= 7)
        return `<span class="text-rose-400 font-mono">${val}</span>`;
    return `<span class="text-slate-300 font-mono">${val}</span>`;
}
async function queryScoutPlayers(offsetVal = 0) {
    scoutPageOffset = Math.max(0, offsetVal);
    const tbody = document.getElementById("scoutExcelTableBody");
    const countEl = document.getElementById("scoutResultCountLabel");
    const pageInfoEl = document.getElementById("scoutPaginationLabel");
    if (!tbody)
        return;
    try {
        const params = buildScoutQueryParams(scoutPageOffset);
        const res = await fetch(`/api/players?${params.toString()}`);
        const data = await res.json();
        scoutTotalCount = data.total || 0;
        const players = data.players || [];
        if (countEl) {
            countEl.innerText = `${scoutTotalCount.toLocaleString("tr-TR")} kayıt`;
        }
        if (pageInfoEl) {
            const startNum = scoutTotalCount === 0 ? 0 : scoutPageOffset + 1;
            const endNum = Math.min(scoutTotalCount, scoutPageOffset + SCOUT_PAGE_LIMIT);
            pageInfoEl.innerText = `${startNum}-${endNum} / ${scoutTotalCount.toLocaleString("tr-TR")}`;
        }
        if (!data.is_loaded) {
            tbody.innerHTML = `
        <tr>
          <td colspan="16" class="py-12 text-center text-slate-400 text-xs">
            <i class="fa-solid fa-database text-2xl text-indigo-400 mb-2 block"></i>
            Üstteki menüden bir <b>FM 26 / FM 27 (.fm)</b> kayıt dosyası seçip <b>"Kaydı Yükle"</b> butonuna tıklayın veya bilgisayarınızdan <b>.fm Dosyası Seç</b> ile yükleyin.
          </td>
        </tr>
      `;
            return;
        }
        if (players.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="16" class="py-10 text-center text-slate-400 text-xs">
            Seçilen Excel sütun filtrelerine uygun oyuncu bulunamadı.
          </td>
        </tr>
      `;
            return;
        }
        tbody.innerHTML = players.map((p, idx) => {
            const rowNum = scoutPageOffset + idx + 1;
            return `
        <tr onclick="openScoutPlayerModal(${p.uid})" class="excel-row border-b border-indigo-950/50 hover:bg-indigo-900/40 cursor-pointer transition text-[11px]">
          <td class="px-2 py-1 text-slate-500 font-mono text-center border-r border-indigo-950/40">${rowNum}</td>
          <td class="px-2.5 py-1 font-semibold text-white whitespace-nowrap border-r border-indigo-950/40">
            <div class="flex items-center justify-between gap-1.5">
              <span>${p.name}</span>
              ${p.age <= 21 && p.pa >= 150 ? '<span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold">WK</span>' : ''}
            </div>
          </td>
          <td class="px-2 py-1 text-center font-mono text-slate-200 border-r border-indigo-950/40">${p.age}</td>
          <td class="px-2 py-1 text-cyan-300 font-semibold whitespace-nowrap border-r border-indigo-950/40">${p.positions || "-"}</td>
          <td class="px-2.5 py-1 text-slate-300 truncate max-w-[140px] border-r border-indigo-950/40">${p.club_name}</td>
          <td class="px-2 py-1 text-slate-400 truncate max-w-[90px] border-r border-indigo-950/40">${p.nation_name}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatAbilityBadge(p.ca)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatAbilityBadge(p.pa)}</td>
          <td class="px-2 py-1 text-center font-mono text-emerald-400 border-r border-indigo-950/40">+${p.potential_gap}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.consistency)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.important_matches)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.injury_proneness, true)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.versatility)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.ambition)}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatHiddenStat(p.professionalism)}</td>
          <td class="px-2 py-1 text-center">${formatHiddenStat(p.pressure)}</td>
        </tr>
      `;
        }).join("");
    }
    catch (err) {
        console.error("Scout sorgu hatası:", err);
    }
}
function scoutPrevPage() {
    if (scoutPageOffset >= SCOUT_PAGE_LIMIT) {
        queryScoutPlayers(scoutPageOffset - SCOUT_PAGE_LIMIT);
    }
}
function scoutNextPage() {
    if (scoutPageOffset + SCOUT_PAGE_LIMIT < scoutTotalCount) {
        queryScoutPlayers(scoutPageOffset + SCOUT_PAGE_LIMIT);
    }
}
function exportScoutCsv() {
    const params = buildScoutQueryParams(0);
    window.open(`/api/export-csv?${params.toString()}`, "_blank");
}
async function openScoutPlayerModal(uid) {
    const modal = document.getElementById("scoutPlayerModal");
    const content = document.getElementById("scoutPlayerModalContent");
    if (!modal || !content)
        return;
    modal.classList.remove("hidden");
    content.innerHTML = `<div class="py-10 text-center text-slate-400 text-xs">Oyuncu profili yükleniyor...</div>`;
    try {
        const res = await fetch(`/api/player/${uid}`);
        const p = await res.json();
        const hiddenItems = [
            ["Tutarlılık (Consistency)", p.hidden.consistency, false],
            ["Önemli Maçlar (Big Matches)", p.hidden.important_matches, false],
            ["Sakatlık Eğilimi (Injury Proneness)", p.hidden.injury_proneness, true],
            ["Çok Yönlülük (Versatility)", p.hidden.versatility, false],
            ["Çirkeflik (Dirtiness)", p.hidden.dirtiness, true]
        ];
        const persItems = [
            ["Profesyonellik", p.personality.professionalism, false],
            ["Hırs (Ambition)", p.personality.ambition, false],
            ["Baskıya Dayanıklılık", p.personality.pressure, false],
            ["Sadakat (Loyalty)", p.personality.loyalty, false],
            ["Mizaç (Temperament)", p.personality.temperament, false],
            ["Sportmenlik", p.personality.sportsmanship, false],
            ["Uyum (Adaptability)", p.personality.adaptability, false],
            ["Tartışma (Controversy)", p.personality.controversy, true]
        ];
        content.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-950 pb-3 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-white">${p.name}</h3>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-900/70 text-cyan-300 font-semibold">${(p.positions || []).join(", ")}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${p.club_name} • ${p.nation_name} • ${p.age} Yaş • Boy: ${p.height_cm} cm • Sol/Sağ Ayak: ${p.left_foot}/20 - ${p.right_foot}/20</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-center bg-fmDark px-3 py-1.5 rounded-lg border border-indigo-900">
            <div class="text-[10px] text-slate-400">Mevcut (CA)</div>
            <div class="text-sm font-bold text-cyan-300 font-mono">${p.ca}</div>
          </div>
          <div class="text-center bg-fmDark px-3 py-1.5 rounded-lg border border-emerald-800/70">
            <div class="text-[10px] text-slate-400">Potansiyel (PA)</div>
            <div class="text-sm font-bold text-emerald-400 font-mono">${p.pa}</div>
          </div>
          <button onclick="assignScoutPlayerToActiveSlot('${p.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition">
            <i class="fa-solid fa-futbol mr-1"></i> Taktiğe Ata
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 text-xs">
        <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80">
          <h4 class="font-bold text-cyan-400 mb-2">Gizli Saha Özellikleri (1-20)</h4>
          <div class="space-y-1.5">
            ${hiddenItems.map(([label, val, inv]) => `
              <div class="flex justify-between items-center border-b border-indigo-950/40 pb-1">
                <span class="text-slate-300">${label}</span>
                ${formatHiddenStat(Number(val), Boolean(inv))}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80">
          <h4 class="font-bold text-amber-400 mb-2">Gizli Karakter & Kişilik (1-20)</h4>
          <div class="space-y-1.5">
            ${persItems.map(([label, val, inv]) => `
              <div class="flex justify-between items-center border-b border-indigo-950/40 pb-1">
                <span class="text-slate-300">${label}</span>
                ${formatHiddenStat(Number(val), Boolean(inv))}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    }
    catch (err) {
        content.innerHTML = `<div class="py-6 text-center text-rose-400 text-xs">Oyuncu detayları alınamadı.</div>`;
    }
}
function closeScoutPlayerModal() {
    const modal = document.getElementById("scoutPlayerModal");
    if (modal)
        modal.classList.add("hidden");
}
function assignScoutPlayerToActiveSlot(playerName) {
    updateActivePlayerName(playerName);
    closeScoutPlayerModal();
    const mainWorkspaceSwitcher = window.switchMainWorkspace;
    if (typeof mainWorkspaceSwitcher === "function") {
        mainWorkspaceSwitcher("tactic");
    }
}
