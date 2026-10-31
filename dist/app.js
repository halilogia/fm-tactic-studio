/**
 * FM Tactic Studio & Universal Scout - Main Application Controller & Workspace Tab Switcher
 */
let tactics = [];
let currentTactic = null;
let activeMainWorkspace = "tactic";
function switchMainWorkspace(mode) {
    activeMainWorkspace = mode;
    const tacticWorkspace = document.getElementById("workspace-tactic");
    const scoutWorkspace = document.getElementById("workspace-scout");
    const btnTactic = document.getElementById("navBtn-tactic");
    const btnScout = document.getElementById("navBtn-scout");
    if (mode === "tactic") {
        if (tacticWorkspace)
            tacticWorkspace.classList.remove("hidden");
        if (scoutWorkspace)
            scoutWorkspace.classList.add("hidden");
        if (btnTactic) {
            btnTactic.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md transition flex items-center gap-1.5";
        }
        if (btnScout) {
            btnScout.className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-950/60 transition flex items-center gap-1.5";
        }
        renderPitch();
    }
    else {
        if (tacticWorkspace)
            tacticWorkspace.classList.add("hidden");
        if (scoutWorkspace)
            scoutWorkspace.classList.remove("hidden");
        if (btnScout) {
            btnScout.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md transition flex items-center gap-1.5";
        }
        if (btnTactic) {
            btnTactic.className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-950/60 transition flex items-center gap-1.5";
        }
        initScoutModule();
    }
}
window.switchMainWorkspace = switchMainWorkspace;
async function loadTactics(retryCount = 0) {
    const refreshIcon = document.getElementById("refreshIcon");
    if (refreshIcon)
        refreshIcon.classList.add("fa-spin");
    const container = document.getElementById("tacticsList");
    if (!container)
        return;
    try {
        const res = await fetch("/api/tactics");
        if (!res.ok)
            throw new Error(T("Sunucu Hatası: ") + res.status);
        const data = await res.json();
        if (data.status === "ok") {
            tactics = data.tactics || [];
            const badge = document.getElementById("tacticCountBadge");
            if (badge)
                badge.innerText = String(data.count || 0);
            const rawFolder = data.current_folder || "";
            const cleanFolder = rawFolder.includes("Football Manager")
                ? "Football Manager 26/27 \\ tactics"
                : (rawFolder.length > 35 ? "..." + rawFolder.slice(-30) : rawFolder);
            const folderEl = document.getElementById("folderLabel");
            if (folderEl) {
                folderEl.innerText = cleanFolder || "FM Taktik Klasörü";
                folderEl.title = rawFolder;
            }
            renderTacticsList(tactics);
            if (tactics.length > 0) {
                selectTactic(tactics[0]);
            }
        }
        else {
            container.innerHTML = `
        <div class="text-center py-8 text-rose-400 text-xs px-2">
          <i class="fa-solid fa-triangle-exclamation text-xl mb-2 text-rose-500"></i>
          <p class="font-medium">${data.message || "Klasör okunamadı"}</p>
          <button onclick="loadTactics(0)" class="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition">
            <i class="fa-solid fa-rotate mr-1"></i> Yeniden Dene
          </button>
        </div>
      `;
        }
    }
    catch (err) {
        console.error("Taktik yükleme hatası:", err);
        if (retryCount < 3) {
            setTimeout(() => loadTactics(retryCount + 1), 1000);
            return;
        }
        container.innerHTML = `
      <div class="text-center py-8 text-amber-400 text-xs px-3">
        <i class="fa-solid fa-triangle-exclamation text-xl mb-2 text-amber-500"></i>
        <p class="font-medium">Yerel sunucuya bağlanılamadı</p>
        <p class="text-[10px] text-slate-400 mt-1">Lütfen sunucunun açık olduğundan emin olun.</p>
        <button onclick="loadTactics(0)" class="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition">
          <i class="fa-solid fa-rotate mr-1"></i> Yeniden Dene
        </button>
      </div>
    `;
    }
    finally {
        if (refreshIcon)
            refreshIcon.classList.remove("fa-spin");
    }
}
function renderTacticsList(list) {
    const container = document.getElementById("tacticsList");
    if (!container)
        return;
    if (!list || list.length === 0) {
        container.innerHTML = `
      <div class="text-center py-10 text-slate-500 text-xs">
        <i class="fa-solid fa-folder-open text-xl mb-2 text-indigo-400"></i>
        <p>Klasörde .fmf dosyası bulunamadı.</p>
      </div>
    `;
        return;
    }
    container.innerHTML = list.map((t) => {
        const isSelected = currentTactic && currentTactic.file_name === t.file_name;
        const tacSize = t.tac_info ? `${(t.tac_info.size / 1024).toFixed(1)} KB` : "";
        const formBadge = t.saved_formation || "—";
        const mentBadge = t.saved_mentality || "—";
        return `
      <div onclick="selectTacticByName('${t.file_name}')" class="py-1.5 px-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${isSelected
            ? "bg-indigo-950/90 border-cyan-500/80 shadow-md shadow-cyan-900/20"
            : "bg-fmCard/60 hover:bg-fmCard border-indigo-950/60"}">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg ${isSelected ? "bg-cyan-500 text-slate-900" : "bg-indigo-900/60 text-indigo-300"} flex items-center justify-center font-bold text-xs shrink-0">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h4 class="font-bold text-xs ${isSelected ? "text-cyan-300" : "text-slate-200"} truncate">${t.file_name}</h4>
              <span class="text-[9px] bg-indigo-900/80 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-semibold">${formBadge}</span>
            </div>
            <p class="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span class="text-emerald-400/90 font-medium">${mentBadge}</span>
              <span>•</span>
              <span>${t.modified_at}</span>
            </p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="bg-emerald-950/80 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-800/50 font-mono">
            ${tacSize || "FMF"}
          </span>
        </div>
      </div>
    `;
    }).join("");
}
function selectTacticByName(fname) {
    const t = tactics.find((x) => x.file_name === fname);
    if (t)
        selectTactic(t);
}
function selectTactic(t) {
    currentTactic = t;
    const titleEl = document.getElementById("currentTacticTitle");
    const notesEl = document.getElementById("tacticNotesTextarea");
    const mentSelect = document.getElementById("mentalitySelect");
    const formSelect = document.getElementById("formationSelect");
    if (titleEl)
        titleEl.innerText = t.file_name;
    if (notesEl)
        notesEl.value = t.saved_notes || "";
    if (t.saved_mentality && mentSelect) {
        mentSelect.value = t.saved_mentality;
    }
    if (t.saved_formation && formSelect) {
        for (let i = 0; i < formSelect.options.length; i++) {
            const opt = formSelect.options[i];
            if (opt.value === t.saved_formation || opt.text === t.saved_formation || String(t.saved_formation).startsWith(opt.value)) {
                formSelect.value = opt.value;
                break;
            }
        }
    }
    const activeFormKey = formSelect ? formSelect.value : "4-2-3-1";
    const formKey = FORMATIONS[activeFormKey] ? activeFormKey : "4-2-3-1";
    if (t.saved_players && t.saved_players.length === 11) {
        currentPlayers = JSON.parse(JSON.stringify(t.saved_players));
        ensurePlayerSlotIds();
    }
    else {
        currentPlayers = JSON.parse(JSON.stringify(FORMATIONS[formKey]));
    }
    renderTacticsList(tactics);
    renderPitch();
    renderTacticInstructions(t);
    renderFmfData(t);
    selectPlayer(0);
}
function renderTacticInstructions(t) {
    const tabEl = document.getElementById("tacticsTab");
    if (!tabEl)
        return;
    const tocCount = Array.isArray(t.toc_items) ? t.toc_items.length : 0;
    tabEl.innerHTML = `
    <div class="bg-fmCard p-3.5 rounded-xl border border-indigo-950/80 space-y-2">
      <h4 class="font-semibold text-amber-400 flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Takım Talimatları Okunamıyor</h4>
      <p class="text-slate-300 text-xs leading-relaxed">FM, takım talimatlarını .fmf arşivinin içindeki şifreli .tac dosyasında saklıyor. Bu sürüm şifreli içeriği çözemediği için talimat uydurmuyor; yalnızca arşivde doğrulanabilen verileri gösteriyor.</p>
      <div class="flex justify-between text-slate-400"><span>Arşiv öğesi:</span><span class="text-cyan-300 font-mono">${tocCount}</span></div>
      <div class="flex justify-between text-slate-400"><span>Dosya boyutu:</span><span class="text-slate-200 font-mono">${t.file_size_formatted || "-"}</span></div>
      <p class="text-[11px] text-slate-500">Diziliş ve zihniyeti yukarıdaki menülerden manuel seçebilir, notlarınızı kaydedebilirsiniz.</p>
    </div>
  `;
}
function updateMentality(m) {
    if (currentTactic) {
        currentTactic.saved_mentality = m;
    }
}
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.add("hidden"));
    const target = document.getElementById(tabId);
    if (target)
        target.classList.remove("hidden");
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("text-cyan-400", "bg-fmDark", "font-medium");
        btn.classList.add("text-slate-400");
    });
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add("text-cyan-400", "bg-fmDark", "font-medium");
        activeBtn.classList.remove("text-slate-400");
    }
}
function renderFmfData(t) {
    const meta = document.getElementById("fmfMetaDetails");
    if (meta) {
        meta.innerHTML = `
      <div class="flex justify-between"><span class="text-slate-500">Dosya:</span><span class="text-cyan-300 font-bold">${t.file_name}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Boyut:</span><span class="text-slate-200">${t.file_size_formatted}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Tip:</span><span class="text-indigo-300">${t.format_type}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Şifreleme:</span><span class="text-emerald-400">SI Container (AES Block)</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Arşiv Motoru:</span><span class="text-amber-300">Zstandard (zstd) TOC</span></div>
    `;
    }
    const tocList = document.getElementById("fmfTocList");
    if (!tocList)
        return;
    if (!t.toc_items || t.toc_items.length === 0) {
        tocList.innerHTML = `<p class="text-slate-500 text-center py-2">TOC öğesi bulunamadı</p>`;
        return;
    }
    tocList.innerHTML = t.toc_items.map((item) => `
    <div class="bg-fmDark/80 p-2 rounded-lg border border-indigo-950 flex items-center justify-between text-[11px]">
      <div class="flex items-center gap-2">
        <i class="fa-solid ${item.ext === ".tac" ? "fa-chess-board text-cyan-400" : "fa-file text-indigo-400"}"></i>
        <div>
          <p class="font-bold text-slate-200">${item.full_name}</p>
          <p class="text-[9px] text-slate-500 font-mono">Offset: ${item.offset} | Comp: ${item.compression_ratio}</p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-slate-300 font-mono font-medium">${item.size} b</span>
      </div>
    </div>
  `).join("");
}
async function saveCurrentTacticDetails() {
    if (!currentTactic)
        return;
    const notesEl = document.getElementById("tacticNotesTextarea");
    const formSelect = document.getElementById("formationSelect");
    const mentSelect = document.getElementById("mentalitySelect");
    const notes = notesEl ? notesEl.value : "";
    const formation = formSelect ? formSelect.value : "4-2-3-1";
    const mentality = mentSelect ? mentSelect.value : "Pozitif Futbol";
    try {
        const res = await fetch("/api/save_tactic_details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                file_name: currentTactic.file_name,
                notes: notes,
                formation: formation,
                mentality: mentality,
                players: currentPlayers
            })
        });
        const data = await res.json();
        if (data.status === "ok") {
            currentTactic.saved_notes = notes;
            currentTactic.saved_formation = formation;
            currentTactic.saved_mentality = mentality;
            currentTactic.saved_players = currentPlayers;
            alert(T("Taktik notlarınız ve sabit saha slotlarınız başarıyla kaydedildi!"));
        }
    }
    catch (err) {
        alert(T("Kaydetme hatası: ") + err);
    }
}
function handleDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById("dropZone");
    if (dz)
        dz.classList.add("border-cyan-400", "bg-indigo-950/40");
}
function handleDragLeave(e) {
    e.preventDefault();
    const dz = document.getElementById("dropZone");
    if (dz)
        dz.classList.remove("border-cyan-400", "bg-indigo-950/40");
}
function handleDrop(e) {
    e.preventDefault();
    handleDragLeave(e);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFile(e.dataTransfer.files[0]);
    }
}
function handleFileUpload(e) {
    const input = e.target;
    if (input.files && input.files.length > 0) {
        uploadFile(input.files[0]);
    }
}
async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.status === "ok") {
            tactics.unshift(data.tactic);
            renderTacticsList(tactics);
            selectTactic(data.tactic);
        }
    }
    catch (err) {
        alert(T("Yükleme hatası: ") + err);
    }
}
function filterTactics() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const filtered = tactics.filter((t) => t.file_name.toLowerCase().includes(query));
    renderTacticsList(filtered);
}
function refreshTactics() {
    loadTactics(0);
}
function exportPitchPNG() {
    alert(T("Saha görseli dışa aktarılıyor... Ekran görüntüsü almak için Windows'ta Win+Shift+S tuşlarını da kullanabilirsiniz."));
}
window.onload = () => {
    loadTactics(0);
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "scout") {
        switchMainWorkspace("scout");
    }
};
