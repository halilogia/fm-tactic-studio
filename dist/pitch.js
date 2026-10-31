/**
 * FM Tactic Studio - FM 26/27 Fixed-Slot 2D Tactical Pitch & Swap Drag-and-Drop Controller
 */
let currentPlayers = JSON.parse(JSON.stringify(FORMATIONS["4-2-3-1"]));
let selectedPlayerIdx = 0;
let isDragging = false;
let hasMovedDuringDrag = false;
let dragIdx = -1;
let dragStartClientX = 0;
let dragStartClientY = 0;
let hoveredSlotId = null;
let dragGhostX = 50;
let dragGhostY = 50;
function ensurePlayerSlotIds() {
    currentPlayers.forEach((p) => {
        if (!p.slotId || !FIXED_TACTICAL_SLOTS[p.slotId]) {
            const nearest = findNearestFixedSlot(p.x, p.y);
            p.slotId = nearest.slotId;
            p.pos = nearest.pos;
        }
        const canonical = FIXED_TACTICAL_SLOTS[p.slotId];
        if (canonical) {
            p.x = canonical.x;
            p.y = canonical.y;
            p.pos = canonical.pos;
        }
    });
}
function findNearestFixedSlot(xPct, yPct) {
    let bestSlot = FIXED_TACTICAL_SLOTS["MC"];
    let minDist = Infinity;
    for (const key of Object.keys(FIXED_TACTICAL_SLOTS)) {
        const slot = FIXED_TACTICAL_SLOTS[key];
        const dx = slot.x - xPct;
        const dy = slot.y - yPct;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
            minDist = dist;
            bestSlot = slot;
        }
    }
    return bestSlot;
}
function renderPitch() {
    const container = document.getElementById("playersContainer");
    if (!container)
        return;
    ensurePlayerSlotIds();
    const occupiedBySlot = {};
    currentPlayers.forEach((p, idx) => {
        occupiedBySlot[p.slotId] = idx;
    });
    // 1. Render 24 canonical FM 26/27 fixed tactical slots (prominent during drag, subtle when idle & empty)
    const slotsHtml = Object.keys(FIXED_TACTICAL_SLOTS).map((slotKey) => {
        const slot = FIXED_TACTICAL_SLOTS[slotKey];
        const occupantIdx = occupiedBySlot[slot.slotId];
        const isOccupied = occupantIdx !== undefined;
        const isHovered = isDragging && hasMovedDuringDrag && hoveredSlotId === slot.slotId;
        if (isOccupied && (!isDragging || !hasMovedDuringDrag)) {
            return "";
        }
        const ringClass = isHovered
            ? (isOccupied
                ? "border-amber-400 bg-amber-500/35 scale-125 shadow-lg shadow-amber-500/40 opacity-100"
                : "border-cyan-400 bg-cyan-500/35 scale-125 shadow-lg shadow-cyan-500/40 opacity-100")
            : (isDragging && hasMovedDuringDrag
                ? "border-white/40 bg-slate-950/45 opacity-90"
                : "border-white/15 bg-slate-950/15 opacity-30");
        return `
      <div
        data-slot-id="${slot.slotId}"
        style="left: ${slot.x}%; top: ${slot.y}%;"
        title="${slot.slotId} - ${slot.label}"
        class="tactical-slot absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-dashed flex items-center justify-center transition-all duration-150 pointer-events-none z-10 ${ringClass}"
      >
        <span class="text-[7px] font-mono font-bold ${isHovered ? 'text-white' : 'text-white/60'}">${slot.slotId}</span>
      </div>
    `;
    }).join("");
    // 2. Render 11 player tokens cleanly centered on their canonical slot
    const playersHtml = currentPlayers.map((p, idx) => {
        const isSelected = selectedPlayerIdx === idx;
        const isBeingDragged = isDragging && hasMovedDuringDrag && dragIdx === idx;
        const isSwapTarget = isDragging && hasMovedDuringDrag && dragIdx !== idx && hoveredSlotId === p.slotId;
        const renderX = isBeingDragged ? dragGhostX : p.x;
        const renderY = isBeingDragged ? dragGhostY : p.y;
        return `
      <div 
        id="playerNode-${idx}" 
        onmousedown="startDrag(event, ${idx})"
        style="left: ${renderX}%; top: ${renderY}%;"
        class="player-token absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab ${isBeingDragged ? 'z-40 opacity-90 pointer-events-none' : (isSelected ? 'selected z-30' : 'z-20')}"
      >
        <div class="player-circle relative w-10 h-10 rounded-full bg-gradient-to-tr ${p.pos === 'GK' ? 'from-amber-600 to-yellow-400' : 'from-indigo-700 to-cyan-500'} border-2 ${isSwapTarget
            ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse'
            : (isSelected ? 'border-cyan-300 ring-2 ring-cyan-400/60' : 'border-white/90')} flex items-center justify-center text-white font-bold text-xs shadow-lg">
          ${p.num}
          <span class="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] px-1 rounded font-mono text-cyan-300">
            ${p.duty}
          </span>
        </div>
        <div class="mt-0.5 bg-slate-900/95 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-white whitespace-nowrap border ${isSwapTarget ? 'border-amber-400 text-amber-300' : (isSelected ? 'border-cyan-400/80 text-cyan-200' : 'border-slate-700/70')} shadow">
          <span class="text-cyan-300 font-bold">${p.slotId}</span> • ${p.name.length > 12 ? p.name.slice(0, 12) + '.' : p.name}
        </div>
        <div class="player-role-label" title="${T(p.role || 'Rol seçilmedi')}">
          ${T(p.role || 'Rol seçilmedi')}
        </div>
      </div>
    `;
    }).join("");
    container.innerHTML = slotsHtml + playersHtml;
}
function selectPlayer(idx) {
    const p = currentPlayers[idx];
    if (!p)
        return;
    selectedPlayerIdx = idx;
    switchTab("playerTab");
    const shirtEl = document.getElementById("playerShirtNum");
    const titleEl = document.getElementById("playerPosTitle");
    const nameInput = document.getElementById("playerNameInput");
    const dutyBadge = document.getElementById("playerDutyBadge");
    const coordsLabel = document.getElementById("playerCoordsLabel");
    if (shirtEl)
        shirtEl.innerText = String(p.num);
    if (titleEl)
        titleEl.innerText = `${p.slotId} (${p.pos}) - ${p.name}`;
    if (nameInput)
        nameInput.value = p.name;
    if (dutyBadge) {
        dutyBadge.innerText = p.duty === "De" ? "Savunma" : (p.duty === "Su" ? "Destek" : (p.duty === "At" ? "Hücum" : "Otomatik"));
    }
    if (coordsLabel) {
        coordsLabel.innerText = `Slot: ${p.slotId} (${p.pos})`;
    }
    document.querySelectorAll(".duty-btn").forEach((btn) => {
        if (btn.getAttribute("data-duty") === p.duty) {
            btn.classList.add("bg-indigo-600", "text-white", "border-indigo-400");
            btn.classList.remove("bg-fmDark", "text-slate-300");
        }
        else {
            btn.classList.remove("bg-indigo-600", "text-white", "border-indigo-400");
            btn.classList.add("bg-fmDark", "text-slate-300");
        }
    });
    const roleSelect = document.getElementById("playerRoleSelect");
    if (roleSelect) {
        const availableRoles = ROLES_BY_POS[p.pos] || ["Merkez Oyuncu", "Destek", "Hücum"];
        roleSelect.innerHTML = availableRoles.map((r) => `
      <option value="${r}" ${r === p.role ? "selected" : ""}>${r}</option>
    `).join("");
    }
    renderPitch();
}
function updateActivePlayerName(name) {
    if (currentPlayers[selectedPlayerIdx]) {
        currentPlayers[selectedPlayerIdx].name = name;
        const titleEl = document.getElementById("playerPosTitle");
        if (titleEl) {
            const p = currentPlayers[selectedPlayerIdx];
            titleEl.innerText = `${p.slotId} (${p.pos}) - ${p.name}`;
        }
        renderPitch();
    }
}
function updateActivePlayerRole(role) {
    if (currentPlayers[selectedPlayerIdx]) {
        currentPlayers[selectedPlayerIdx].role = role;
        renderPitch();
    }
}
function setPlayerDuty(duty) {
    if (currentPlayers[selectedPlayerIdx]) {
        currentPlayers[selectedPlayerIdx].duty = duty;
        selectPlayer(selectedPlayerIdx);
    }
}
function applyFormation(formationKey) {
    if (FORMATIONS[formationKey]) {
        currentPlayers = JSON.parse(JSON.stringify(FORMATIONS[formationKey]));
        renderPitch();
        selectPlayer(0);
    }
}
function startDrag(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    hasMovedDuringDrag = false;
    dragIdx = idx;
    dragStartClientX = e.clientX;
    dragStartClientY = e.clientY;
    const p = currentPlayers[idx];
    dragGhostX = p.x;
    dragGhostY = p.y;
    hoveredSlotId = p.slotId;
    selectPlayer(idx);
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", stopDrag);
}
function onDragMove(e) {
    if (!isDragging || dragIdx === -1)
        return;
    const dxPx = e.clientX - dragStartClientX;
    const dyPx = e.clientY - dragStartClientY;
    if (!hasMovedDuringDrag && (dxPx * dxPx + dyPx * dyPx) < 25) {
        // Ignore tiny <5px jitter on simple click so token never jumps off its fixed slot
        return;
    }
    hasMovedDuringDrag = true;
    const pitch = document.getElementById("pitchWrapper");
    if (!pitch)
        return;
    const rect = pitch.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    dragGhostX = Math.max(6, Math.min(94, x));
    dragGhostY = Math.max(6, Math.min(92, y));
    const nearestSlot = findNearestFixedSlot(dragGhostX, dragGhostY);
    hoveredSlotId = nearestSlot.slotId;
    const coordsLabel = document.getElementById("playerCoordsLabel");
    if (coordsLabel) {
        const targetOccupant = currentPlayers.find((pl, i) => i !== dragIdx && pl.slotId === nearestSlot.slotId);
        if (targetOccupant) {
            coordsLabel.innerText = `Takas: ${nearestSlot.slotId} (${targetOccupant.name})`;
        }
        else {
            coordsLabel.innerText = `Hedef Slot: ${nearestSlot.slotId} (${nearestSlot.label})`;
        }
    }
    renderPitch();
}
function stopDrag() {
    if (!isDragging || dragIdx === -1)
        return;
    if (hasMovedDuringDrag) {
        const draggedPlayer = currentPlayers[dragIdx];
        const targetSlotId = hoveredSlotId || draggedPlayer.slotId;
        const targetSlot = FIXED_TACTICAL_SLOTS[targetSlotId];
        if (targetSlot && draggedPlayer) {
            const existingIdx = currentPlayers.findIndex((p, i) => i !== dragIdx && p.slotId === targetSlot.slotId);
            if (existingIdx !== -1) {
                const otherPlayer = currentPlayers[existingIdx];
                const tempName = draggedPlayer.name;
                const tempNum = draggedPlayer.num;
                draggedPlayer.name = otherPlayer.name;
                draggedPlayer.num = otherPlayer.num;
                otherPlayer.name = tempName;
                otherPlayer.num = tempNum;
                selectedPlayerIdx = existingIdx;
            }
            else if (draggedPlayer.slotId !== targetSlot.slotId) {
                draggedPlayer.slotId = targetSlot.slotId;
                draggedPlayer.pos = targetSlot.pos;
                draggedPlayer.x = targetSlot.x;
                draggedPlayer.y = targetSlot.y;
                const validRoles = ROLES_BY_POS[targetSlot.pos] || [];
                if (!validRoles.includes(draggedPlayer.role)) {
                    draggedPlayer.role = targetSlot.defaultRole;
                    draggedPlayer.duty = targetSlot.defaultDuty;
                }
                selectedPlayerIdx = dragIdx;
            }
        }
    }
    isDragging = false;
    hasMovedDuringDrag = false;
    dragIdx = -1;
    hoveredSlotId = null;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", stopDrag);
    selectPlayer(selectedPlayerIdx);
}
let activeBestXiLineup = [];
let activeFormationRanking = [];
async function requestAutoBestXI() {
    const clubInput = document.getElementById("scoutClubInput");
    const colClubInput = document.getElementById("colFilterClub");
    let targetClub = (clubInput && clubInput.value.trim()) || (colClubInput && colClubInput.value.trim()) || "Beşiktaş A.Ş.";
    const modal = document.getElementById("bestXiModal");
    const clubTitle = document.getElementById("bestXiModalClub");
    const content = document.getElementById("bestXiModalContent");
    if (modal)
        modal.classList.remove("hidden");
    if (clubTitle)
        clubTitle.innerText = targetClub;
    if (content) {
        content.innerHTML = `<div class="py-12 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin text-xl text-amber-400 mb-2 block"></i> ${targetClub} kadrosu taranıyor, 6 diziliş simüle ediliyor...</div>`;
    }
    try {
        // Step 1: Rank all 6 formations against this club's player pool
        const fRes = await fetch("/api/recommend-formation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ club_name: targetClub })
        });
        const fData = await fRes.json();
        if (!fRes.ok)
            throw new Error(fData.detail || T("Formasyon analizi alınamadı"));
        activeFormationRanking = fData.formations || [];
        renderFormationComparison(fData);
        // Step 2: Auto-load the winner's XI into the modal preview
        if (fData.best_choice && fData.best_lineup) {
            activeBestXiLineup = fData.best_lineup;
            renderBestXiModalContent({
                club_name: targetClub,
                lineup: fData.best_lineup,
                weakest_link: (fData.formations && fData.formations[0]) ? fData.formations[0].weakest_link : null,
                transfer_targets: []
            });
        }
    }
    catch (err) {
        if (content) {
            content.innerHTML = `<div class="py-6 text-center text-rose-400 text-xs">Hata: ${err.message || err}</div>`;
        }
    }
}
function renderFormationComparison(data) {
    const content = document.getElementById("bestXiModalContent");
    if (!content)
        return;
    const formations = data.formations || [];
    const best = data.best_choice;
    const cards = formations.map((f, idx) => {
        const isBest = f.name === best;
        const rankColors = ["bg-amber-500", "bg-cyan-500", "bg-indigo-500"];
        return `
      <button onclick="selectFormationCandidate('${f.name}')" class="text-left bg-fmDark/90 p-3 rounded-xl border ${isBest ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-indigo-900 hover:border-cyan-500/60'} transition">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full ${rankColors[idx] || 'bg-slate-600'} text-white text-[10px] font-bold flex items-center justify-center">${idx + 1}</span>
            <span class="font-bold text-white text-sm">${f.name}</span>
            ${isBest ? '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/50">AI SEÇİMİ</span>' : ''}
          </div>
          <span class="font-mono font-bold text-emerald-400 text-xs">%${f.avg_slot_rating}</span>
        </div>
        <div class="flex items-center justify-between text-[10px]">
          <span class="text-slate-400">En zayıf: ${f.weakest_link ? `${f.weakest_link.slotId} • %${f.worst_slot_rating}` : '-'}</span>
          <span class="text-cyan-400 font-bold hover:underline">Detaylandır ←</span>
        </div>
      </button>
    `;
    }).join("");
    const banner = `
    <div class="bg-indigo-950/50 border border-indigo-800 rounded-xl p-3">
      <div class="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1">
        <i class="fa-solid fa-chess-board"></i>
        <span>Formasyon Sıralaması — Oyuncu Havuzuna Göre</span>
      </div>
      <p class="text-[11px] text-slate-300">6 diziliş ${data.club_name || 'kadro'} oyuncularıyla simüle edildi. Ortalama mevkî uygunluk puanına göre sıralandı. AI önerisi: <b class="text-amber-400">${best || '-'}</b>. Kart seç → o dizilişin ideal 11'i açılır.</p>
    </div>
  `;
    content.innerHTML = banner + `<div class="grid grid-cols-2 md:grid-cols-3 gap-2">${cards}</div>`;
}
async function selectFormationCandidate(formationKey) {
    const f = activeFormationRanking.find((x) => x.name === formationKey);
    if (!f || !f.lineup)
        return;
    activeBestXiLineup = f.lineup;
    renderBestXiModalContent({
        club_name: f.name,
        lineup: f.lineup,
        weakest_link: f.weakest_link,
        transfer_targets: []
    });
    // Apply the exact slot topology of the picked formation behind the modal, so "Yerleştir" lands cleanly
    if (FORMATIONS[formationKey]) {
        currentPlayers = JSON.parse(JSON.stringify(FORMATIONS[formationKey]));
        renderPitch();
    }
    // Refresh global transfer targets for this formation's weakest slot
    try {
        const slotsPayload = f.lineup.map((p) => ({ slotId: p.slotId, pos: p.pos }));
        const res = await fetch("/api/recommend-xi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ club_name: "", slots: slotsPayload })
        });
        const data = await res.json();
        if (res.ok && data.transfer_targets) {
            renderBestXiModalContent({
                club_name: f.name,
                lineup: f.lineup,
                weakest_link: f.weakest_link,
                transfer_targets: data.transfer_targets
            });
        }
    }
    catch (err) {
        // Keep the lineup visible even if target fetch fails
    }
}
function renderBestXiModalContent(data) {
    const content = document.getElementById("bestXiModalContent");
    if (!content)
        return;
    const lineup = data.lineup || [];
    const weakest = data.weakest_link;
    const targets = data.transfer_targets || [];
    const lineupRows = lineup.map((p) => `
    <tr class="border-b border-indigo-950/60 hover:bg-indigo-900/30 text-xs">
      <td class="px-2.5 py-1.5 font-bold font-mono text-cyan-300">${p.slotId}</td>
      <td class="px-2 py-1.5 text-slate-400 font-semibold">${p.pos}</td>
      <td class="px-2.5 py-1.5 font-semibold text-white">${p.name}</td>
      <td class="px-2 py-1.5 text-center font-mono text-cyan-400 font-bold">${p.ca}</td>
      <td class="px-2 py-1.5 text-center font-mono text-emerald-400 font-bold">${p.pa}</td>
      <td class="px-2.5 py-1.5 text-center">
        <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800 font-mono text-[11px]">%${p.slot_rating}</span>
      </td>
    </tr>
  `).join("");
    const targetsHtml = targets.map((t) => `
    <div class="bg-fmDark/90 p-2.5 rounded-xl border border-indigo-900 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-white text-xs">${t.name}</span>
          <span class="text-[10px] text-slate-400">(${t.age} Yaş)</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${t.club_name}</div>
      </div>
      <div class="flex items-center gap-2 text-right">
        <div>
          <div class="text-[10px] text-slate-400 font-mono">CA: <b class="text-cyan-300">${t.ca}</b> / PA: <b class="text-emerald-400">${t.pa}</b></div>
          <div class="text-[11px] text-emerald-400 font-bold">%${t.best_rating} Rol Puanı</div>
        </div>
        <button onclick="closeBestXiModal(); openScoutPlayerModal(${t.uid});" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition">İncele</button>
      </div>
    </div>
  `).join("");
    const isFormationView = FORMATIONS.hasOwnProperty(data.club_name);
    content.innerHTML = `
    ${isFormationView ? `
      <button onclick="renderFormationComparison({ formations: activeFormationRanking, best_choice: activeFormationRanking[0] && activeFormationRanking[0].name, club_name: '${data.club_name}' })"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800 hover:border-cyan-500/60 rounded-xl text-[11px] font-bold text-cyan-300 hover:text-cyan-200 transition">
        <i class="fa-solid fa-arrow-left"></i> ${data.club_name} • Diğer Dizilişleri Karşılaştır
      </button>
    ` : ''}
    ${isFormationView ? `
      <div class="bg-amber-950/30 border border-amber-700/50 rounded-xl p-2.5 text-center">
        <span class="text-amber-300 text-xs font-bold">Diziliş: ${data.club_name}</span>
        <span class="text-[10px] text-slate-400 ml-2">— bu kadronun oyuncularına göre en uygun 11 aşağıda</span>
      </div>
    ` : ''}
    <!-- 11 Lineup Table -->
    <div class="bg-fmDark/80 rounded-xl border border-indigo-950 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-indigo-950/70 text-[11px] text-slate-300 font-bold border-b border-indigo-900">
          <tr>
            <th class="px-2.5 py-1.5">Slot</th>
            <th class="px-2 py-1.5">Mevki</th>
            <th class="px-2.5 py-1.5">Seçilen Oyuncu</th>
            <th class="px-2 py-1.5 text-center">CA</th>
            <th class="px-2 py-1.5 text-center">PA</th>
            <th class="px-2.5 py-1.5 text-center">Mevki Uygunluk %</th>
          </tr>
        </thead>
        <tbody>
          ${lineupRows}
        </tbody>
      </table>
    </div>

    <!-- Weakest Link Warning & Global Transfer Recommendations -->
    ${weakest ? `
      <div class="bg-amber-950/40 border border-amber-600/70 p-3 rounded-xl space-y-2">
        <div class="flex items-center gap-2 text-amber-300 text-xs font-bold">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-sm"></i>
          <span>En Zayıf Halka: ${weakest.slotId} (${weakest.pos}) — ${weakest.name} (Uygunluk: %${weakest.slot_rating})</span>
        </div>
        <p class="text-[11px] text-slate-300">Bu mevkide kadro kalitesini yükseltmek için save veri tabanından önerilen 3 transfer hedefi:</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          ${targetsHtml || '<div class="text-slate-400 text-xs col-span-3">Uygun hedef bulunamadı.</div>'}
        </div>
      </div>
    ` : ''}
  `;
}
function applyCurrentBestXi() {
    if (!activeBestXiLineup || activeBestXiLineup.length === 0)
        return;
    activeBestXiLineup.forEach((item) => {
        const p = currentPlayers.find((cp) => cp.slotId === item.slotId);
        if (p) {
            p.name = item.name;
        }
    });
    renderPitch();
    selectPlayer(0);
    const applyInfo = document.getElementById("applyBestXiInfo");
    if (applyInfo) {
        applyInfo.innerText = "11 taktik tahtasına yerleştirildi ✅";
        applyInfo.classList.remove("hidden");
        setTimeout(() => applyInfo.classList.add("hidden"), 2500);
    }
    closeBestXiModal();
}
function closeBestXiModal() {
    const modal = document.getElementById("bestXiModal");
    if (modal)
        modal.classList.add("hidden");
}
