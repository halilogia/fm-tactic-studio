/**
 * FM Universal Scout Controller (TypeScript)
 * Features:
 * - Excel-Like Data Grid & Column Filtering
 * - Dedicated Type-and-Confirm Club Picker (Kulüp Seçici) with Loaned/Youth Player Integration
 * - Positional Suitability Ratings % (GK..ST)
 * - Development Speed Index (S+/A+/A/B/C)
 * - Shortlist & Scout Notes
 * - Player Comparison Chart
 * - Career Baseline Progress Tracker (real recorded deltas)
 * - Save Watcher & Instant Save Live-Reload
 */
let scoutSortBy = "pa";
let scoutSortOrder = "desc";
let scoutPageOffset = 0;
const SCOUT_PAGE_LIMIT = 100;
let scoutTotalCount = 0;
let scoutWonderkidsOnly = false;
let scoutFreeAgentsOnly = false;
let scoutExpiringContractsOnly = false;
let scoutYouthOnly = false;
let scoutShortlistOnly = false;
let scoutClubMeta = {};
let scoutShortlistCount = 0;
let scoutDebounceTimer = null;
let scoutSaveWatcherInterval = null;
let scoutInitialized = false;
let scoutActiveClub = "";
let scoutActiveModalPlayer = null;
let scoutComparePlayer2 = null;
let scoutActiveModalTab = "overview";
async function initScoutModule() {
    if (scoutInitialized)
        return;
    scoutInitialized = true;
    await fetchAvailableSaves();
    await fetchClubsForPicker();
    await fetchShortlistMeta();
    const params = new URLSearchParams(window.location.search);
    const clubParam = params.get("club");
    const clubInput = document.getElementById("scoutClubInput");
    if (clubParam) {
        const resolved = resolveClubName(clubParam);
        if (clubInput)
            clubInput.value = resolved;
        const colClubInput = document.getElementById("colFilterClub");
        if (colClubInput)
            colClubInput.value = resolved;
        scoutActiveClub = resolved;
        updateActiveClubBanner(resolved);
    }
    if (params.get("youth") === "1") {
        scoutYouthOnly = true;
        updateYouthToggleButton();
    }
    await queryScoutPlayers(0);
    startSaveWatcher();
}
// ==================== DEDICATED CLUB PICKER (KULÜP SEÇİCİ) ====================
async function fetchClubsForPicker() {
    const datalist = document.getElementById("scoutClubsDatalist");
    if (!datalist)
        return;
    try {
        const res = await fetch("/api/clubs");
        const data = await res.json();
        const clubs = data.clubs || [];
        scoutClubMeta = {};
        datalist.innerHTML = clubs.map((c) => {
            scoutClubMeta[c.club_name] = { player_count: c.player_count, youth_count: c.youth_count || 0 };
            const youthPart = c.youth_count > 0 ? ` • ${c.youth_count} Altyapı` : "";
            return `<option value="${c.club_name}">${c.club_name} (${c.player_count} Oyuncu${youthPart} • Ort CA: ${c.avg_ca})</option>`;
        }).join("");
    }
    catch (err) {
        console.error("Kulüp listesi datalist'e yüklenemedi:", err);
    }
}
function confirmClubPicker() {
    const input = document.getElementById("scoutClubInput");
    const colClubInput = document.getElementById("colFilterClub");
    const clubName = input ? input.value.trim() : "";
    scoutActiveClub = clubName;
    if (colClubInput) {
        colClubInput.value = clubName;
    }
    updateActiveClubBanner(clubName);
    queryScoutPlayers(0);
}
function clearClubPicker() {
    const input = document.getElementById("scoutClubInput");
    const colClubInput = document.getElementById("colFilterClub");
    if (input)
        input.value = "";
    if (colClubInput)
        colClubInput.value = "";
    scoutActiveClub = "";
    updateActiveClubBanner("");
    queryScoutPlayers(0);
}
function handleClubPickerKeyDown(event) {
    if (event.key === "Enter") {
        confirmClubPicker();
    }
}
function selectQuickClub(clubName) {
    const input = document.getElementById("scoutClubInput");
    if (input)
        input.value = clubName;
    confirmClubPicker();
}
function resolveClubName(query) {
    const needle = query.trim().toLowerCase();
    if (!needle)
        return query;
    const exact = Object.keys(scoutClubMeta).find((name) => name.toLowerCase() === needle);
    if (exact)
        return exact;
    const partial = Object.keys(scoutClubMeta).find((name) => name.toLowerCase().startsWith(needle));
    return partial || query;
}
function updateActiveClubBanner(clubName) {
    const banner = document.getElementById("activeClubBanner");
    const title = document.getElementById("activeClubTitle");
    const stats = document.getElementById("activeClubStats");
    if (!banner || !title)
        return;
    if (clubName) {
        banner.classList.remove("hidden");
        title.innerText = clubName;
        if (stats) {
            const meta = scoutClubMeta[clubName] || scoutClubMeta[resolveClubName(clubName)];
            stats.innerText = meta
                ? `(${meta.player_count} Oyuncu${meta.youth_count > 0 ? ` • ${meta.youth_count} Altyapı` : ""})`
                : `(Kadrosu & Kiralık Oyuncuları)`;
        }
    }
    else {
        banner.classList.add("hidden");
    }
}
// ==================== SHORTLIST & SCOUT NOTES ====================
async function fetchShortlistMeta() {
    try {
        const res = await fetch("/api/shortlist");
        const data = await res.json();
        scoutShortlistCount = data.count || 0;
        updateShortlistBadge();
    }
    catch (err) {
        console.error("Takip listesi meta verisi alınamadı:", err);
    }
}
function updateShortlistBadge() {
    const badge = document.getElementById("shortlistBadgeCount");
    if (badge) {
        badge.innerText = String(scoutShortlistCount);
    }
}
function toggleShortlistFilter() {
    scoutShortlistOnly = !scoutShortlistOnly;
    const btn = document.getElementById("btnShortlistToggle");
    if (btn) {
        btn.className = scoutShortlistOnly
            ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 border border-amber-300 shadow-md transition"
            : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
    }
    queryScoutPlayers(0);
}
async function toggleShortlistStar(event, uid) {
    event.stopPropagation();
    try {
        const res = await fetch("/api/shortlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: uid, action: "toggle" })
        });
        const data = await res.json();
        scoutShortlistCount = data.count || 0;
        updateShortlistBadge();
        const starBtn = event.currentTarget;
        if (starBtn) {
            if (data.in_shortlist) {
                starBtn.innerHTML = `<i class="fa-solid fa-star text-amber-400"></i>`;
                starBtn.setAttribute("title", "Takip listesinden çıkar");
            }
            else {
                starBtn.innerHTML = `<i class="fa-regular fa-star text-slate-600 hover:text-amber-400"></i>`;
                starBtn.setAttribute("title", "Takip listesine ekle");
            }
        }
        if (scoutShortlistOnly && !data.in_shortlist) {
            queryScoutPlayers(scoutPageOffset);
        }
    }
    catch (err) {
        console.error("Shortlist yıldızlama hatası:", err);
    }
}
async function saveScoutPlayerNote(uid, note) {
    try {
        await fetch("/api/shortlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: uid, action: "add", note: note })
        });
        const statusLabel = document.getElementById("scoutNoteSavedStatus");
        if (statusLabel) {
            statusLabel.innerText = "Kaydedildi ✔";
            setTimeout(() => { if (statusLabel)
                statusLabel.innerText = ""; }, 2000);
        }
    }
    catch (err) {
        console.error("Keşif notu kaydetme hatası:", err);
    }
}
// ==================== SAVE DISK WATCHER & INSTANT LIVE RELOAD ====================
function startSaveWatcher() {
    if (scoutSaveWatcherInterval)
        return;
    scoutSaveWatcherInterval = window.setInterval(checkSaveStatus, 8000);
}
async function checkSaveStatus() {
    try {
        const res = await fetch("/api/save-status");
        const data = await res.json();
        const banner = document.getElementById("saveUpdateBanner");
        const diskTimeEl = document.getElementById("saveUpdateDiskTime");
        if (data.has_update && banner) {
            banner.classList.remove("hidden");
            if (diskTimeEl)
                diskTimeEl.innerText = data.disk_time_str || "Yeni";
        }
    }
    catch (err) {
        // Silent polling error catch
    }
}
async function reloadCurrentSave() {
    const banner = document.getElementById("saveUpdateBanner");
    const reloadBtn = document.getElementById("btnReloadSave");
    const icon = document.getElementById("reloadSaveIcon");
    if (icon)
        icon.classList.add("fa-spin");
    if (reloadBtn)
        reloadBtn.disabled = true;
    try {
        const res = await fetch("/api/reload-save", { method: "POST" });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.detail || T("Yeniden yüklenemedi"));
        if (banner)
            banner.classList.add("hidden");
        const statusBadge = document.getElementById("scoutSaveStatusBadge");
        if (statusBadge && data.save_info) {
            statusBadge.innerText = `${data.save_info.file_name} • ${(data.total_players || 0).toLocaleString("tr-TR")} Oyuncu (Yenilendi: ${data.save_info.loaded_at || ""})`;
            statusBadge.className = "bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[11px] px-2.5 py-0.5 rounded-full font-mono";
        }
        await fetchClubsForPicker();
        await queryScoutPlayers(0);
    }
    catch (err) {
        alert(T("Kayıt yenileme hatası: ") + (err.message || err));
    }
    finally {
        if (icon)
            icon.classList.remove("fa-spin");
        if (reloadBtn)
            reloadBtn.disabled = false;
    }
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
        alert(T("Lütfen listeden bir .fm kaydı seçin veya dosya yükleyin."));
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
            throw new Error(data.detail || T("Kayıt yüklenemedi"));
        }
        if (statusBadge && data.save_info) {
            statusBadge.innerText = `${data.save_info.file_name} • ${(data.total_players || 0).toLocaleString("tr-TR")} Oyuncu`;
            statusBadge.className = "bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[11px] px-2.5 py-0.5 rounded-full font-mono";
        }
        await fetchClubsForPicker();
        await queryScoutPlayers(0);
    }
    catch (err) {
        alert(T("Kayıt dosyası okuma hatası: ") + (err.message || err));
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
            throw new Error(data.detail || T("Yükleme başarısız"));
        await fetchAvailableSaves();
        await fetchClubsForPicker();
        await queryScoutPlayers(0);
    }
    catch (err) {
        alert(T("FM Save yükleme hatası: ") + (err.message || err));
    }
}
// ==================== QUERY PARAMS & FILTER CONTROLS ====================
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
    params.set("max_age", getFilterVal("colFilterMaxAge", "55") || "55");
    params.set("min_best_rating", getFilterVal("colFilterMinRating", "0") || "0");
    params.set("min_dev_score", getFilterVal("colFilterMinDev", "0") || "0");
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
    params.set("free_agents_only", String(scoutFreeAgentsOnly));
    params.set("youth_only", String(scoutYouthOnly));
    params.set("shortlist_only", String(scoutShortlistOnly));
    params.set("max_contract_year", scoutExpiringContractsOnly ? "2027" : "0");
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
        btn.className = scoutWonderkidsOnly
            ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 border border-amber-300 shadow-md transition"
            : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
    }
    queryScoutPlayers(0);
}
function toggleFreeAgentsFilter() {
    scoutFreeAgentsOnly = !scoutFreeAgentsOnly;
    const btn = document.getElementById("btnFreeAgentsToggle");
    if (btn) {
        btn.className = scoutFreeAgentsOnly
            ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 border border-emerald-300 shadow-md transition"
            : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-emerald-300 border border-emerald-700/60 hover:bg-emerald-950/50 transition";
    }
    queryScoutPlayers(0);
}
function toggleExpiringContractsFilter() {
    scoutExpiringContractsOnly = !scoutExpiringContractsOnly;
    const btn = document.getElementById("btnExpiringToggle");
    if (btn) {
        btn.className = scoutExpiringContractsOnly
            ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white border border-rose-300 shadow-md transition"
            : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-rose-300 border border-rose-700/60 hover:bg-rose-950/50 transition";
    }
    queryScoutPlayers(0);
}
function updateYouthToggleButton() {
    const btn = document.getElementById("btnYouthToggle");
    if (!btn)
        return;
    btn.className = scoutYouthOnly
        ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-fuchsia-500 text-white border border-fuchsia-300 shadow-md transition"
        : "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-fuchsia-300 border border-fuchsia-700/60 hover:bg-fuchsia-950/50 transition";
}
function toggleYouthFilter() {
    scoutYouthOnly = !scoutYouthOnly;
    updateYouthToggleButton();
    queryScoutPlayers(0);
}
function resetScoutFilters() {
    const ids = [
        "scoutGlobalSearch", "scoutClubInput", "colFilterName", "colFilterClub", "colFilterNation", "colFilterPos",
        "colFilterMinRating", "colFilterMinDev", "colFilterMinAge", "colFilterMaxAge", "colFilterMinCA", "colFilterMinPA",
        "colFilterMinCons", "colFilterMinImp", "colFilterMaxInj", "colFilterMinVers",
        "colFilterMinAmb", "colFilterMinProf", "colFilterMinPres"
    ];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el)
            el.value = "";
    });
    scoutActiveClub = "";
    updateActiveClubBanner("");
    scoutWonderkidsOnly = false;
    scoutFreeAgentsOnly = false;
    scoutExpiringContractsOnly = false;
    scoutYouthOnly = false;
    scoutShortlistOnly = false;
    const btnWk = document.getElementById("btnWonderkidsToggle");
    if (btnWk)
        btnWk.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
    const btnFa = document.getElementById("btnFreeAgentsToggle");
    if (btnFa)
        btnFa.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-emerald-300 border border-emerald-700/60 hover:bg-emerald-950/50 transition";
    const btnEx = document.getElementById("btnExpiringToggle");
    if (btnEx)
        btnEx.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-rose-300 border border-rose-700/60 hover:bg-rose-950/50 transition";
    const btnSl = document.getElementById("btnShortlistToggle");
    if (btnSl)
        btnSl.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-fmDark text-amber-300 border border-amber-700/60 hover:bg-amber-950/50 transition";
    updateYouthToggleButton();
    queryScoutPlayers(0);
}
function sortScoutColumn(col) {
    if (scoutSortBy === col) {
        scoutSortOrder = scoutSortOrder === "desc" ? "asc" : "desc";
    }
    else {
        scoutSortBy = col;
        scoutSortOrder = col === "injury_proneness" || col === "age" || col === "name" || col === "positions_order" ? "asc" : "desc";
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
// ==================== VALUE FORMATTERS & BADGES ====================
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
function formatPlayerStatus(p) {
    const code = p.status_code || 0;
    // Priority: Injured(1) > Suspended(2) > Low Condition(3) > Loaned Out(4) > Expiring Contract(5) > Free Agent(6) > Normal(0)
    switch (code) {
        case 1:
            return {
                nameColorClass: "text-rose-400 font-bold",
                badge: `<span class="text-[8px] bg-rose-950/80 text-rose-300 border border-rose-600/70 px-1 rounded font-bold ml-1" title="Sakat">🏥</span>`
            };
        case 2:
            return {
                nameColorClass: "text-orange-400 font-bold",
                badge: `<span class="text-[8px] bg-orange-950/80 text-orange-300 border border-orange-600/70 px-1 rounded font-bold ml-1" title="Cezalı">🟨</span>`
            };
        case 3:
            return {
                nameColorClass: "text-amber-400 font-semibold",
                badge: `<span class="text-[8px] bg-amber-950/80 text-amber-300 border border-amber-600/70 px-1 rounded font-bold ml-1" title="Kondisyon Düşük">⚡</span>`
            };
        case 4:
            return {
                nameColorClass: "text-purple-300 font-semibold",
                badge: `<span class="text-[8px] bg-purple-950/80 text-purple-300 border border-purple-600/70 px-1 rounded font-bold ml-1" title="Kirada">${p.loan_parent_club_name ? p.loan_parent_club_name.slice(0, 8) : 'Kirada'}</span>`
            };
        case 5:
            return {
                nameColorClass: "text-cyan-300 font-semibold",
                badge: `<span class="text-[8px] bg-cyan-950/80 text-cyan-300 border border-cyan-600/70 px-1 rounded font-bold ml-1" title="Sözleşme Bitiyor">⏳</span>`
            };
        case 6:
            return {
                nameColorClass: "text-slate-400 font-medium",
                badge: `<span class="text-[8px] bg-slate-900 text-slate-400 border border-slate-600/70 px-1 rounded font-bold ml-1" title="Serbest (Kulüpsüz)">F/A</span>`
            };
        default:
            return { nameColorClass: "text-white", badge: "" };
    }
}
function formatDevTierBadge(tier, score) {
    let color = "bg-slate-800 text-slate-300 border-slate-700";
    if (tier === "S+")
        color = "bg-purple-950/80 text-purple-300 border-purple-700/80";
    else if (tier === "A+")
        color = "bg-emerald-950/80 text-emerald-300 border-emerald-700/80";
    else if (tier === "A")
        color = "bg-cyan-950/80 text-cyan-300 border-cyan-700/80";
    else if (tier === "B")
        color = "bg-amber-950/80 text-amber-300 border-amber-700/80";
    return `<span class="px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono ${color}" title="Gelişim İndeksi: ${score}/99">${tier} <span class="opacity-80">${score}</span></span>`;
}
function formatPositionalRatingBadge(pos, rating) {
    let color = "text-slate-300 border-slate-800 bg-slate-900";
    if (rating >= 85.0)
        color = "text-emerald-300 border-emerald-700/80 bg-emerald-950/70";
    else if (rating >= 75.0)
        color = "text-cyan-300 border-cyan-700/80 bg-cyan-950/70";
    else if (rating >= 65.0)
        color = "text-amber-300 border-amber-700/80 bg-amber-950/70";
    return `<span class="px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono ${color}">${pos} %${rating}</span>`;
}
// ==================== MAIN TABLE QUERY & RENDER ====================
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
          <td colspan="20" class="py-12 text-center text-slate-400 text-xs">
            <i class="fa-solid fa-database text-2xl text-indigo-400 mb-2 block"></i>
            Üstteki menüden bir <b>FM 26 / FM 27 (.fm)</b> kayıt dosyası seçip <b>"Kaydı Yükle"</b> butonuna tıklayın.
          </td>
        </tr>
      `;
            return;
        }
        if (players.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="20" class="py-10 text-center text-slate-400 text-xs">
            Seçilen filtre kriterlerine uygun oyuncu bulunamadı.
          </td>
        </tr>
      `;
            return;
        }
        tbody.innerHTML = players.map((p, idx) => {
            const rowNum = scoutPageOffset + idx + 1;
            const fmt = formatPlayerStatus(p);
            const isLoanedOut = p.is_on_loan && p.loan_parent_club_name;
            const isLoanedIn = p.is_on_loan && !p.loan_parent_club_name;
            const youthBadge = p.team_level
                ? `<span class="shrink-0 ml-1 text-[9px] bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-700/60 px-1 rounded font-bold" title="${p.team_label}">${p.team_level}</span>`
                : "";
            // Delta (+1, +2)
            let caDeltaBadge = "";
            if (p.ca_delta > 0) {
                caDeltaBadge = `<span class="text-[9px] text-emerald-400 font-bold font-mono ml-0.5">+${p.ca_delta}</span>`;
            }
            else if (p.ca_delta < 0) {
                caDeltaBadge = `<span class="text-[9px] text-rose-400 font-bold font-mono ml-0.5">${p.ca_delta}</span>`;
            }
            return `
        <tr onclick="openScoutPlayerModal(${p.uid})" class="excel-row border-b border-indigo-950/50 hover:bg-indigo-900/40 cursor-pointer transition text-[11px]">
          <td class="px-2 py-1 text-slate-500 font-mono text-center border-r border-indigo-950/40">${rowNum}</td>
          <td onclick="toggleShortlistStar(event, ${p.uid})" class="px-1.5 py-1 text-center border-r border-indigo-950/40 hover:scale-125 transition">
            <i class="fa-regular fa-star text-slate-600 hover:text-amber-400"></i>
          </td>
          <td class="px-2.5 py-1 whitespace-nowrap border-r border-indigo-950/40">
            <div class="flex items-center justify-between gap-1.5">
              <span class="${fmt.nameColorClass}">${p.name}</span>
              <span class="whitespace-nowrap">
                ${fmt.badge}
                ${p.age <= 21 && p.pa >= 150 ? '<span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold ml-0.5">WK</span>' : ''}
              </span>
            </div>
          </td>
          <td class="px-2 py-1 text-center font-mono text-slate-200 border-r border-indigo-950/40">${p.age}</td>
          <td class="px-2 py-1 text-cyan-300 font-semibold whitespace-nowrap border-r border-indigo-950/40">${p.positions || "-"}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatPositionalRatingBadge(p.best_pos, p.best_rating)}</td>
          <td class="px-2 py-1 text-center font-mono text-emerald-400 font-bold border-r border-indigo-950/40">%${p.pot_rating}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40">${formatDevTierBadge(p.dev_tier, p.dev_score)}</td>
          <td onclick="event.stopPropagation(); selectQuickClub('${p.club_name.replace(/'/g, "\\'")}')" title="${p.team_label || p.club_name} kadrosunu getirmek için tıklayın" class="px-2.5 py-1 text-slate-300 hover:text-cyan-300 border-r border-indigo-950/40">
            <div class="flex items-center max-w-[170px]">
              <span class="truncate ${isLoanedOut ? "text-slate-200" : ""}">${p.club_name}</span>
              ${youthBadge}
            </div>
          </td>
          <td class="px-2 py-1 text-slate-400 truncate max-w-[80px] border-r border-indigo-950/40">${p.nation_name}</td>
          <td class="px-2 py-1 text-center border-r border-indigo-950/40 whitespace-nowrap">${formatAbilityBadge(p.ca)}${caDeltaBadge}</td>
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
// ==================== PLAYER MODAL (TABS: OVERVIEW, RADAR, GROWTH) ====================
async function openScoutPlayerModal(uid) {
    const modal = document.getElementById("scoutPlayerModal");
    const content = document.getElementById("scoutPlayerModalContent");
    if (!modal || !content)
        return;
    modal.classList.remove("hidden");
    content.innerHTML = `<div class="py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-xl text-cyan-400 mb-2 block"></i> Oyuncu profili ve analiz verileri yükleniyor...</div>`;
    try {
        const res = await fetch(`/api/player/${uid}`);
        const p = await res.json();
        scoutActiveModalPlayer = p;
        scoutComparePlayer2 = null;
        scoutActiveModalTab = "overview";
        renderPlayerModal(p);
    }
    catch (err) {
        content.innerHTML = `<div class="py-6 text-center text-rose-400 text-xs">Oyuncu detayları alınamadı.</div>`;
    }
}
function switchModalTab(tab) {
    scoutActiveModalTab = tab;
    if (scoutActiveModalPlayer) {
        renderPlayerModal(scoutActiveModalPlayer);
    }
}
function renderPlayerModal(p) {
    const content = document.getElementById("scoutPlayerModalContent");
    if (!content)
        return;
    const positionsList = (p.positions || []).join(", ");
    const posRatings = p.positional_ratings || {};
    // Modal status badge helpers
    const modalStatusBadges = [];
    if (p.status_label === "Sakat")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-600/70">🏥 Sakat</span>`);
    if (p.status_label === "Cezalı")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-orange-950 text-orange-300 font-bold border border-orange-600/70">🟨 Cezalı</span>`);
    if (p.status_label === "Kirada")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-600/70">📤 Kirada: ${p.loan_parent_club_name || 'Kulüp'}</span>`);
    if (p.status_label === "Kondisyon %")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-600/70">⚡ Kondisyon Düşük (%${Math.round((p.raw_condition || 10000) / 100)})</span>`);
    if (p.status_label === "Sözleşme Bitiyor")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-600/70">⏳ Sözleşme Bitiyor (${p.contract_end_str || ''})</span>`);
    if (p.status_label === "Serbest")
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-bold border border-slate-600/70">F/A Serbest</span>`);
    if (p.team_level)
        modalStatusBadges.push(`<span class="text-xs px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 font-bold border border-fuchsia-600/70">🎓 ${p.team_label || p.team_level}</span>`);
    // Positional bars, restricted to positions the save says the player can play.
    const posKeys = ["GK", "DC", "FB", "DM", "MC", "W", "AMC", "ST"];
    const positionKeyMap = {
        GK: "GK", DC: "DC", DL: "FB", DR: "FB", WBL: "FB", WBR: "FB",
        DM: "DM", MC: "MC", ML: "W", MR: "W", AML: "W", AMR: "W",
        AMC: "AMC", ST: "ST", STC: "ST", STCL: "ST", STCR: "ST"
    };
    const eligibleKeys = new Set((p.positions || []).map((pos) => positionKeyMap[pos]).filter(Boolean));
    const raw = p.position_ratings_raw || {};
    const rawLabels = [
        ["gk", "GK"], ["dc", "DC"], ["dl", "DL"], ["dr", "DR"], ["wbl", "WBL"], ["wbr", "WBR"],
        ["dm", "DM"], ["mc", "MC"], ["ml", "ML"], ["mr", "MR"], ["amc", "AMC"], ["aml", "AML"],
        ["amr", "AMR"], ["stc", "ST"]
    ];
    const rawPositionText = rawLabels
        .filter(([key]) => Number(raw[key] || 0) >= 10)
        .map(([key, label]) => `${label} ${raw[key]}`)
        .join(" · ");
    const posBarsHtml = posKeys.map((k) => {
        const val = posRatings[k] || 30.0;
        const eligible = eligibleKeys.size === 0 || eligibleKeys.has(k);
        let barColor = "bg-slate-700";
        if (!eligible)
            barColor = "bg-slate-700";
        else if (val >= 80.0)
            barColor = "bg-gradient-to-r from-emerald-500 to-cyan-400";
        else if (val >= 70.0)
            barColor = "bg-cyan-500";
        else if (val >= 60.0)
            barColor = "bg-amber-500";
        return `
      <div class="space-y-0.5 ${eligible ? "" : "opacity-45"}" title="${eligible ? "" : "Oyuncunun kayıtlı doğal mevkisi değil"}">
        <div class="flex justify-between text-[11px]">
          <span class="font-bold text-slate-300">${k}${eligible ? "" : " <span class='text-[9px] text-slate-500'>(uygun değil)</span>"}</span>
          <span class="font-mono ${eligible ? "text-cyan-300" : "text-slate-500"} font-semibold">%${val}</span>
        </div>
        <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div class="${barColor} h-1.5 rounded-full" style="width: ${Math.min(100, Math.max(0, val))}%"></div>
        </div>
      </div>
    `;
    }).join("");
    const hiddenItems = [
        ["Tutarlılık (Consistency)", p.hidden.consistency, false],
        ["Önemli Maçlar (Big Matches)", p.hidden.important_matches, false],
        ["Sakatlık Eğilimi (Injury)", p.hidden.injury_proneness, true],
        ["Çok Yönlülük (Versatility)", p.hidden.versatility, false],
        ["Çirkeflik (Dirtiness)", p.hidden.dirtiness, true]
    ];
    const persItems = [
        ["Profesyonellik", p.personality.professionalism, false],
        ["Hırs (Ambition)", p.personality.ambition, false],
        ["Baskıya Dayanıklılık", p.personality.pressure, false],
        ["Kararlılık (Determination)", (p.attributes || {}).determination || 12, false],
        ["Sadakat (Loyalty)", p.personality.loyalty, false],
        ["Uyum (Adaptability)", p.personality.adaptability, false]
    ];
    // Tab 1: Overview
    let tabContentHtml = "";
    if (scoutActiveModalTab === "overview") {
        tabContentHtml = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
        <!-- Positional Suitability Ratings % -->
        <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80 space-y-2">
          <h4 class="font-bold text-cyan-400 flex items-center justify-between">
            <span>Mevki Uygunluk %</span>
            <span class="text-[10px] text-slate-400 font-normal">En İyi: <b class="text-white">${p.best_pos} (%${p.best_rating})</b></span>
          </h4>
          <div class="space-y-2">
            ${posBarsHtml}
          </div>
          ${rawPositionText ? `<p class="text-[10px] text-slate-400 pt-1 border-t border-indigo-950/60">FM kayıt mevkileri: <b class="text-slate-200">${rawPositionText}</b></p>` : ''}
        </div>

        <!-- Hidden Match Attributes -->
        <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80 space-y-2">
          <h4 class="font-bold text-amber-400">Gizli Saha Nitelikleri (1-20)</h4>
          <div class="space-y-1.5">
            ${hiddenItems.map(([label, val, inv]) => `
              <div class="flex justify-between items-center border-b border-indigo-950/40 pb-1">
                <span class="text-slate-300 text-[11px]">${label}</span>
                ${formatHiddenStat(Number(val), Boolean(inv))}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Personality & Scout Note -->
        <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80 flex flex-col justify-between">
          <div class="space-y-1.5">
            <h4 class="font-bold text-emerald-400 mb-1">Karakter & Antrenman</h4>
            ${persItems.map(([label, val, inv]) => `
              <div class="flex justify-between items-center border-b border-indigo-950/40 pb-0.5">
                <span class="text-slate-300 text-[11px]">${label}</span>
                ${formatHiddenStat(Number(val), Boolean(inv))}
              </div>
            `).join("")}
          </div>

          <div class="mt-3 pt-2 border-t border-indigo-950">
            <div class="flex justify-between items-center mb-1">
              <span class="text-[11px] font-bold text-amber-300"><i class="fa-regular fa-note-sticky mr-1"></i> Keşif Notu</span>
              <span id="scoutNoteSavedStatus" class="text-[10px] text-emerald-400 font-mono"></span>
            </div>
            <textarea id="modalScoutNoteText" rows="2" onblur="saveScoutPlayerNote(${p.uid}, this.value)" placeholder="Oyuncu hakkında gözlem notları (otomatik kaydedilir)..." class="w-full bg-slate-900 border border-indigo-950 focus:border-amber-400 rounded-lg p-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none resize-none">${p.shortlist_note || ""}</textarea>
          </div>
        </div>
      </div>
    `;
    }
    else if (scoutActiveModalTab === "radar") {
        tabContentHtml = renderModalRadarTab(p);
    }
    else if (scoutActiveModalTab === "growth") {
        tabContentHtml = renderModalGrowthTab(p);
    }
    content.innerHTML = `
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between border-b border-indigo-950 pb-3">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-lg font-bold text-white">${p.name}</h3>
          <span class="text-xs px-2 py-0.5 rounded bg-indigo-900/70 text-cyan-300 font-semibold">${positionsList}</span>
          ${modalStatusBadges.map(b => b).join('')}
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          ${p.team_label || p.club_name} • ${p.nation_name} • ${p.age} Yaş • Sol/Sağ: ${p.left_foot}/20 - ${p.right_foot}/20
        </p>
      ${String(p.source_game || "").includes("27") ? `<p class="text-[11px] text-amber-300">${T("FM27 okuyucusunun alanları oyun içinde henüz doğrulanmadı. Oyundaki bilgilerle çelişirse oyun ekranını esas alın.")}</p>` : ''}
      </div>

      <div class="flex items-center gap-2 mt-2 sm:mt-0">
        <div class="text-center bg-fmDark px-3 py-1 rounded-lg border border-indigo-900">
          <div class="text-[9px] text-slate-400">Mevcut (CA)</div>
          <div class="text-sm font-bold text-cyan-300 font-mono">${p.ca} ${p.ca_delta > 0 ? `<span class="text-emerald-400 text-xs">+${p.ca_delta}</span>` : ''}</div>
        </div>
        <div class="text-center bg-fmDark px-3 py-1 rounded-lg border border-emerald-800/70">
          <div class="text-[9px] text-slate-400">Potansiyel (PA)</div>
          <div class="text-sm font-bold text-emerald-400 font-mono">${p.pa}</div>
        </div>
        <div class="text-center bg-fmDark px-3 py-1 rounded-lg border border-purple-800/70">
          <div class="text-[9px] text-slate-400 flex items-center justify-center gap-1">
            Gelişim İndeksi
            <button onclick="event.stopPropagation(); openInfoModal('devIndex')" class="w-3.5 h-3.5 rounded-full bg-indigo-900/80 text-indigo-300 text-[9px] font-bold hover:bg-indigo-700 hover:text-white transition" title="Nasıl hesaplanır?">i</button>
          </div>
          <div class="text-sm font-bold text-purple-300 font-mono">${p.dev_tier} (${p.dev_score})</div>
        </div>
        <button onclick="assignScoutPlayerToActiveSlot('${p.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition">
          <i class="fa-solid fa-futbol mr-1"></i> Taktiğe Ata
        </button>
      </div>
    </div>

    <!-- Modal Sub-Tabs -->
    <div class="flex items-center gap-2 border-b border-indigo-950/70 pt-2 pb-1 text-xs font-semibold">
      <button onclick="switchModalTab('overview')" class="px-3 py-1 rounded-lg transition ${scoutActiveModalTab === 'overview' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
        <i class="fa-solid fa-id-card mr-1"></i> Genel & Mevkiler %
      </button>
      <button onclick="switchModalTab('radar')" class="px-3 py-1 rounded-lg transition ${scoutActiveModalTab === 'radar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
        <i class="fa-solid fa-chart-pie mr-1"></i> Karşılaştırma
      </button>
      <button onclick="switchModalTab('growth')" class="px-3 py-1 rounded-lg transition ${scoutActiveModalTab === 'growth' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}">
        <i class="fa-solid fa-chart-line mr-1"></i> Gelişim Geçmişi
      </button>
    </div>

    <!-- Tab Content Area -->
    ${tabContentHtml}
  `;
}
// ==================== TAB 2: PLAYER COMPARISON ====================
function renderModalRadarTab(p) {
    const axes = ["Savunma", "Fiziksel", "Sürat", "Vizyon", "Hücum", "Teknik", "Hava Topu", "Zihinsel"];
    const oct1 = p.octagon || {};
    const oct2 = scoutComparePlayer2 ? (scoutComparePlayer2.octagon || {}) : null;
    const svgRadar = generateOctagonSvg(oct1, oct2);
    const compRowsHtml = axes.map((ax) => {
        const v1 = oct1[ax] || 10.0;
        const v2 = oct2 ? (oct2[ax] || 10.0) : null;
        let diffStr = "";
        if (v2 !== null) {
            const diff = roundNum(v1 - v2, 1);
            diffStr = diff > 0 ? `<span class="text-emerald-400 font-bold font-mono">+${diff}</span>` : (diff < 0 ? `<span class="text-rose-400 font-bold font-mono">${diff}</span>` : `<span class="text-slate-500 font-mono">0.0</span>`);
        }
        return `
      <div class="flex items-center justify-between py-1 border-b border-indigo-950/40 text-xs">
        <span class="text-slate-300 font-medium">${ax}</span>
        <div class="flex items-center gap-3">
          <span class="text-cyan-300 font-mono font-bold">${v1}</span>
          ${v2 !== null ? `<span class="text-amber-300 font-mono font-bold">${v2}</span> ${diffStr}` : ''}
        </div>
      </div>
    `;
    }).join("");
    return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
      <!-- Player comparison chart -->
      <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80 flex flex-col items-center justify-center">
        <div class="flex items-center justify-between w-full mb-2 text-xs">
          <span class="font-bold text-cyan-400 flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> ${p.name}
          </span>
          ${scoutComparePlayer2 ? `
            <span class="font-bold text-amber-400 flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> ${scoutComparePlayer2.name}
            </span>
          ` : ''}
        </div>
        ${svgRadar}
      </div>

      <!-- Compare Player Selector & Stat Differences -->
      <div class="bg-fmDark/90 p-3 rounded-xl border border-indigo-950/80 flex flex-col justify-between">
        <div>
          <label class="text-[11px] font-bold text-slate-400 block mb-1">Karşılaştırılacak 2. Oyuncu Seç</label>
          <div class="flex gap-1.5 mb-3">
            <input type="text" id="comparePlayerInput" placeholder="Oyuncu adı yazın..." onkeydown="if(event.key==='Enter') executePlayerComparison()" class="flex-1 bg-slate-900 border border-indigo-900 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400">
            <button onclick="executePlayerComparison()" class="px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition">Karşılaştır</button>
          </div>

          <div class="space-y-1">
            ${compRowsHtml}
          </div>
        </div>

        ${scoutComparePlayer2 ? `
          <div class="mt-3 pt-2 border-t border-indigo-950 flex justify-between items-center text-[11px] text-slate-400">
            <span>2. Oyuncu: <b class="text-white">${scoutComparePlayer2.name}</b> (${scoutComparePlayer2.club_name})</span>
            <button onclick="clearPlayerComparison()" class="text-rose-400 hover:underline">Karşılaştırmayı Kaldır</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
function generateOctagonSvg(oct1, oct2) {
    const axes = ["Savunma", "Fiziksel", "Sürat", "Vizyon", "Hücum", "Teknik", "Hava Topu", "Zihinsel"];
    const cx = 110;
    const cy = 110;
    const maxR = 80;
    const numAxes = axes.length;
    // Background Web concentric rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    const ringsSvg = rings.map((pct) => {
        const pts = [];
        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const x = cx + maxR * pct * Math.cos(angle);
            const y = cy + maxR * pct * Math.sin(angle);
            pts.push(`${x},${y}`);
        }
        return `<polygon points="${pts.join(" ")}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    }).join("");
    // Axis lines & labels
    let axisLinesSvg = "";
    let axisLabelsSvg = "";
    for (let i = 0; i < numAxes; i++) {
        const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
        const x = cx + maxR * Math.cos(angle);
        const y = cy + maxR * Math.sin(angle);
        axisLinesSvg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
        const lx = cx + (maxR + 16) * Math.cos(angle);
        const ly = cy + (maxR + 16) * Math.sin(angle) + 3;
        axisLabelsSvg += `<text x="${lx}" y="${ly}" fill="#94a3b8" font-size="9" text-anchor="middle" font-weight="600">${axes[i]}</text>`;
    }
    // Polygon 1 (Cyan)
    const pts1 = axes.map((ax, i) => {
        const val = Math.min(20, Math.max(1, oct1[ax] || 10.0));
        const r = (val / 20.0) * maxR;
        const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
    // Polygon 2 (Amber, if active)
    let poly2Svg = "";
    if (oct2) {
        const pts2 = axes.map((ax, i) => {
            const val = Math.min(20, Math.max(1, oct2[ax] || 10.0));
            const r = (val / 20.0) * maxR;
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        poly2Svg = `<polygon points="${pts2}" fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" stroke-width="2"/>`;
    }
    return `
    <svg width="250" height="235" viewBox="0 0 220 220" class="overflow-visible">
      ${ringsSvg}
      ${axisLinesSvg}
      ${axisLabelsSvg}
      <polygon points="${pts1}" fill="rgba(6, 182, 212, 0.35)" stroke="#06b6d4" stroke-width="2"/>
      ${poly2Svg}
    </svg>
  `;
}
async function executePlayerComparison() {
    const input = document.getElementById("comparePlayerInput");
    const nameQuery = input ? input.value.trim() : "";
    if (!nameQuery || !scoutActiveModalPlayer)
        return;
    try {
        const res = await fetch(`/api/players?name_filter=${encodeURIComponent(nameQuery)}&limit=1`);
        const data = await res.json();
        if (data.players && data.players.length > 0) {
            const p2Uid = data.players[0].uid;
            const compRes = await fetch(`/api/player/${p2Uid}`);
            scoutComparePlayer2 = await compRes.json();
            renderPlayerModal(scoutActiveModalPlayer);
        }
        else {
            alert(T(`"${nameQuery}" isminde bir oyuncu bulunamadı.`));
        }
    }
    catch (err) {
        console.error("Karşılaştırma hatası:", err);
    }
}
function clearPlayerComparison() {
    scoutComparePlayer2 = null;
    if (scoutActiveModalPlayer) {
        renderPlayerModal(scoutActiveModalPlayer);
    }
}
// ==================== TAB 3: BASELINE GROWTH TRACKER (+1/+2) ====================
function renderModalGrowthTab(p) {
    const curve = p.dev_curve || [];
    const deltas = p.attr_deltas || {};
    // Find attributes with changes (+1, +2, etc.)
    const positiveChanges = [];
    const negativeChanges = [];
    for (const [attr, delta] of Object.entries(deltas)) {
        const dNum = Number(delta);
        if (dNum > 0)
            positiveChanges.push([attr, dNum]);
        else if (dNum < 0)
            negativeChanges.push([attr, dNum]);
    }
    const positiveBadges = positiveChanges.map(([attr, val]) => `<span class="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">${attr} +${val}</span>`).join(" ");
    const negativeBadges = negativeChanges.map(([attr, val]) => `<span class="bg-rose-950/80 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded text-[11px] font-semibold">${attr} ${val}</span>`).join(" ");
    const svgGraph = generateGrowthChartSvg(curve);
    const caValues = curve.map((entry) => Number(entry.ca));
    const hasRealProgress = caValues.length >= 2;
    return `
    <div class="space-y-3 mt-3 text-xs">
      <!-- Real recorded career growth (no synthetic projections) -->
      <div class="bg-fmDark/90 p-3.5 rounded-xl border border-indigo-950/80 space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-cyan-400 flex items-center gap-1.5">
            <i class="fa-solid fa-chart-line"></i> Gelişim Geçmişi <span class="text-[10px] font-normal text-slate-400">(gerçek kayıtlar)</span>
          </h4>
          <button onclick="resetCareerBaseline()" class="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-[11px] text-cyan-300 font-semibold transition">
            📌 Ölçüm Başlangıcını Sıfırla
          </button>
        </div>
        <p class="text-[11px] text-slate-400">
          İlk ölçüm: <b class="text-cyan-300">${p.baseline_date || "-"}</b>
          · Kayıtlı nokta: <b class="text-slate-200">${curve.length}</b>
        </p>
        ${hasRealProgress ? svgGraph : `
          <div class="text-center text-[11px] text-slate-400 py-5 px-4">
            ${T("Henüz karşılaştırılacak ikinci ölçüm yok. Oyun içinde ilerleyip kaydı yeniden yükleyin.")}
            ${T("Kariyer başlangıç tarihi bu kayıt okuyucusundan alınamıyor; geçmiş değerler tahmin edilmez.")}
          </div>
        `}
      </div>

      <!-- Attribute Changes Since Baseline -->
      <div class="bg-fmDark/90 p-3.5 rounded-xl border border-indigo-950/80 space-y-2">
        <h4 class="font-bold text-slate-200 flex items-center gap-1.5">
          <i class="fa-solid fa-arrow-trend-up text-emerald-400"></i> İlk Ölçümden Bu Yana Gelişen Nitelikler
        </h4>
        <div class="flex flex-wrap gap-1.5">
          ${positiveBadges || '<span class="text-slate-500 text-[11px]">Henüz pozitif nitelik artışı kaydedilmedi (oyunda birkaç ay ilerleyip save alınca görünecektir).</span>'}
        </div>
        ${negativeBadges ? `
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${negativeBadges}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
function generateGrowthChartSvg(curve) {
    if (!curve || curve.length === 0)
        return "";
    const w = 620;
    const h = 130;
    const padX = 60;
    const padY = 25;
    const caValues = curve.map((c) => Number(c.ca));
    const rawMin = Math.min(...caValues);
    const rawMax = Math.max(...caValues);
    const minCa = rawMin === rawMax ? rawMin - 5 : rawMin - 3;
    const maxCa = rawMin === rawMax ? rawMax + 5 : rawMax + 3;
    const points = curve.map((c, i) => {
        const x = curve.length === 1
            ? w / 2
            : padX + (i * (w - 2 * padX)) / (curve.length - 1);
        const caVal = Math.max(minCa, Math.min(maxCa, Number(c.ca)));
        const y = h - padY - ((caVal - minCa) / Math.max(1, maxCa - minCa)) * (h - 2 * padY);
        return { x, y, label: c.label, ca: c.ca, delta: c.delta };
    });
    const polylinePts = points.map(p => `${p.x},${p.y}`).join(" ");
    const nodesSvg = points.map(p => `
    <g class="cursor-pointer">
      <circle cx="${p.x}" cy="${p.y}" r="5" fill="#06b6d4" stroke="#ffffff" stroke-width="2"/>
      <text x="${p.x}" y="${p.y - 10}" fill="#06b6d4" font-size="10" font-weight="bold" text-anchor="middle font-mono">${p.ca}</text>
      <text x="${p.x}" y="${h - 6}" fill="#94a3b8" font-size="9" text-anchor="middle">${p.label}</text>
    </g>
  `).join("");
    return `
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" class="overflow-visible">
      <line x1="${padX}" y1="${padY}" x2="${w - padX}" y2="${padY}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padX}" y1="${h / 2}" x2="${w - padX}" y2="${h / 2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="rgba(255,255,255,0.1)"/>
      ${curve.length > 1 ? `<polyline points="${polylinePts}" fill="none" stroke="url(#growthGradient)" stroke-width="3"/>` : ''}
      ${nodesSvg}
      <defs>
        <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}
async function resetCareerBaseline() {
    try {
        const res = await fetch("/api/reset-baseline", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const data = await res.json();
        alert(T(`Mevcut kayıt verileri ölçüm başlangıcı olarak kaydedildi! (${data.tracked_players} oyuncu takip ediliyor).`));
        if (scoutActiveModalPlayer) {
            await openScoutPlayerModal(scoutActiveModalPlayer.uid);
        }
        await queryScoutPlayers(scoutPageOffset);
    }
    catch (err) {
        alert(T("Başlangıç noktası sabitleme hatası: ") + err);
    }
}
function closeScoutPlayerModal() {
    const modal = document.getElementById("scoutPlayerModal");
    if (modal)
        modal.classList.add("hidden");
}
function assignScoutPlayerToActiveSlot(playerName) {
    window.updateActivePlayerName(playerName);
    closeScoutPlayerModal();
    const mainWorkspaceSwitcher = window.switchMainWorkspace;
    if (typeof mainWorkspaceSwitcher === "function") {
        mainWorkspaceSwitcher("tactic");
    }
}
function roundNum(num, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round(num * f) / f;
}
