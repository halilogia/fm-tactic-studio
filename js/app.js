/**
 * FM Tactic Studio - Main Application Logic & API Controller
 */

let tactics = [];
let currentTactic = null;

// Load and render tactics list with auto-retry
async function loadTactics(retryCount = 0) {
  const refreshIcon = document.getElementById("refreshIcon");
  if (refreshIcon) refreshIcon.classList.add("fa-spin");
  const container = document.getElementById("tacticsList");
  
  try {
    const res = await fetch("/api/tactics");
    if (!res.ok) throw new Error(`Sunucu Hatası: ${res.status}`);
    const data = await res.json();
    
    if (data.status === "ok") {
      tactics = data.tactics || [];
      document.getElementById("tacticCountBadge").innerText = data.count || 0;
      
      // Privacy-safe header: show friendly category instead of personal drive path
      const rawFolder = data.current_folder || "";
      const cleanFolder = rawFolder.includes("Football Manager")
        ? "Football Manager 26 \\ tactics"
        : (rawFolder.length > 35 ? "..." + rawFolder.slice(-30) : rawFolder);
      const folderEl = document.getElementById("folderLabel");
      if (folderEl) {
        folderEl.innerText = cleanFolder || "FM Taktik Klasörü";
        folderEl.title = rawFolder; // Tooltip allows viewing real path safely on hover
      }

      renderTacticsList(tactics);
      if (tactics.length > 0) {
        selectTactic(tactics[0]);
      }
    } else {
      container.innerHTML = `
        <div class="text-center py-8 text-rose-400 text-xs px-2">
          <i class="fa-solid fa-triangle-exclamation text-xl mb-2 text-rose-500"></i>
          <p class="font-medium">${data.message || 'Klasör okunamadı'}</p>
          <button onclick="loadTactics(0)" class="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition">
            <i class="fa-solid fa-rotate mr-1"></i> Yeniden Dene
          </button>
        </div>
      `;
    }
  } catch (err) {
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
  } finally {
    if (refreshIcon) refreshIcon.classList.remove("fa-spin");
  }
}

function renderTacticsList(list) {
  const container = document.getElementById("tacticsList");
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-500 text-xs">
        <i class="fa-solid fa-folder-open text-xl mb-2 text-indigo-400"></i>
        <p>Klasörde .fmf dosyası bulunamadı.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(t => {
    const isSelected = currentTactic && currentTactic.file_name === t.file_name;
    const tacSize = t.tac_info ? `${(t.tac_info.size / 1024).toFixed(1)} KB` : '';
    return `
      <div onclick="selectTacticByName('${t.file_name}')" class="py-1.5 px-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
        isSelected 
          ? 'bg-indigo-950/90 border-cyan-500/80 shadow-md shadow-cyan-900/20' 
          : 'bg-fmCard/60 hover:bg-fmCard border-indigo-950/60'
      }">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-900' : 'bg-indigo-900/60 text-indigo-300'} flex items-center justify-center font-bold text-xs shrink-0">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-xs ${isSelected ? 'text-cyan-300' : 'text-slate-200'} truncate">${t.file_name}</h4>
            <p class="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span>${t.file_size_formatted}</span>
              <span>•</span>
              <span>${t.modified_at}</span>
            </p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="bg-emerald-950/80 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-800/50 font-mono">
            ${tacSize || 'FMF'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function selectTacticByName(fname) {
  const t = tactics.find(x => x.file_name === fname);
  if (t) selectTactic(t);
}

function selectTactic(t) {
  currentTactic = t;
  document.getElementById("currentTacticTitle").innerText = t.file_name;
  document.getElementById("tacticNotesTextarea").value = t.saved_notes || "";
  
  if (t.saved_mentality) {
    document.getElementById("mentalitySelect").value = t.saved_mentality;
  }
  if (t.saved_formation) {
    const select = document.getElementById("formationSelect");
    for (let opt of select.options) {
      if (opt.value === t.saved_formation || opt.text === t.saved_formation || t.saved_formation.startsWith(opt.value)) {
        select.value = opt.value;
        break;
      }
    }
  }

  const activeFormKey = document.getElementById("formationSelect").value || "4-2-3-1";
  const formKey = FORMATIONS[activeFormKey] ? activeFormKey : "4-2-3-1";
  if (t.saved_players && t.saved_players.length === 11) {
    currentPlayers = JSON.parse(JSON.stringify(t.saved_players));
  } else {
    currentPlayers = JSON.parse(JSON.stringify(FORMATIONS[formKey]));
  }

  renderTacticsList(tactics);
  renderPitch();
  renderFmfData(t);
  selectPlayer(0);
}

function updateMentality(m) {
  if (currentTactic) {
    currentTactic.saved_mentality = m;
  }
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("text-cyan-400", "bg-fmDark", "font-medium");
    btn.classList.add("text-slate-400");
  });
  document.getElementById(`btn-${tabId}`).classList.add("text-cyan-400", "bg-fmDark", "font-medium");
  document.getElementById(`btn-${tabId}`).classList.remove("text-slate-400");
}

// Render FMF binary details
function renderFmfData(t) {
  const meta = document.getElementById("fmfMetaDetails");
  meta.innerHTML = `
    <div class="flex justify-between"><span class="text-slate-500">Dosya:</span><span class="text-cyan-300 font-bold">${t.file_name}</span></div>
    <div class="flex justify-between"><span class="text-slate-500">Boyut:</span><span class="text-slate-200">${t.file_size_formatted}</span></div>
    <div class="flex justify-between"><span class="text-slate-500">Tip:</span><span class="text-indigo-300">${t.format_type}</span></div>
    <div class="flex justify-between"><span class="text-slate-500">Şifreleme:</span><span class="text-emerald-400">SI Container (AES Block)</span></div>
    <div class="flex justify-between"><span class="text-slate-500">Arşiv Motoru:</span><span class="text-amber-300">Zstandard (zstd) TOC</span></div>
  `;

  const tocList = document.getElementById("fmfTocList");
  if (!t.toc_items || t.toc_items.length === 0) {
    tocList.innerHTML = `<p class="text-slate-500 text-center py-2">TOC öğesi bulunamadı</p>`;
    return;
  }

  tocList.innerHTML = t.toc_items.map(item => `
    <div class="bg-fmDark/80 p-2 rounded-lg border border-indigo-950 flex items-center justify-between text-[11px]">
      <div class="flex items-center gap-2">
        <i class="fa-solid ${item.ext === '.tac' ? 'fa-chess-board text-cyan-400' : 'fa-file text-indigo-400'}"></i>
        <div>
          <p class="font-bold text-slate-200">${item.full_name}</p>
          <p class="text-[9px] text-slate-500 font-mono">Offset: ${item.offset} | Comp: ${item.compression_ratio}</p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-slate-300 font-mono font-medium">${item.size} b</span>
      </div>
    </div>
  `).join('');
}

// Save Tactic Details
async function saveCurrentTacticDetails() {
  if (!currentTactic) return;
  const notes = document.getElementById("tacticNotesTextarea").value;
  const formation = document.getElementById("formationSelect").value;
  const mentality = document.getElementById("mentalitySelect").value;

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
      alert("Taktik notlarınız ve saha formasyonunuz başarıyla kaydedildi!");
    }
  } catch (err) {
    alert("Kaydetme hatası: " + err);
  }
}

// Drag and drop uploading
function handleDragOver(e) { e.preventDefault(); document.getElementById("dropZone").classList.add("border-cyan-400", "bg-indigo-950/40"); }
function handleDragLeave(e) { e.preventDefault(); document.getElementById("dropZone").classList.remove("border-cyan-400", "bg-indigo-950/40"); }
function handleDrop(e) {
  e.preventDefault();
  handleDragLeave(e);
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    uploadFile(e.dataTransfer.files[0]);
  }
}
function handleFileUpload(e) {
  if (e.target.files && e.target.files.length > 0) {
    uploadFile(e.target.files[0]);
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
  } catch (err) {
    alert("Yükleme hatası: " + err);
  }
}

function filterTactics() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = tactics.filter(t => t.file_name.toLowerCase().includes(query));
  renderTacticsList(filtered);
}

function refreshTactics() {
  loadTactics(0);
}

function exportPitchPNG() {
  alert("Saha görseli dışa aktarılıyor... Ekran görüntüsü almak için Windows'ta Win+Shift+S tuşlarını da kullanabilirsiniz.");
}

// Initial load
window.onload = () => {
  loadTactics(0);
};
