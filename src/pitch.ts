/**
 * FM Tactic Studio - FM 26/27 Fixed-Slot 2D Tactical Pitch & Swap Drag-and-Drop Controller
 */

let currentPlayers: PlayerToken[] = JSON.parse(JSON.stringify(FORMATIONS["4-2-3-1"]));
let selectedPlayerIdx: number = 0;
let isDragging: boolean = false;
let hasMovedDuringDrag: boolean = false;
let dragIdx: number = -1;
let dragStartClientX: number = 0;
let dragStartClientY: number = 0;
let hoveredSlotId: string | null = null;
let dragGhostX: number = 50;
let dragGhostY: number = 50;

function ensurePlayerSlotIds(): void {
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

function findNearestFixedSlot(xPct: number, yPct: number): TacticalSlot {
  let bestSlot: TacticalSlot = FIXED_TACTICAL_SLOTS["MC"];
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

function renderPitch(): void {
  const container = document.getElementById("playersContainer");
  if (!container) return;

  ensurePlayerSlotIds();

  const occupiedBySlot: Record<string, number> = {};
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
        class="player-token absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab ${
          isBeingDragged ? 'z-40 opacity-90 pointer-events-none' : (isSelected ? 'selected z-30' : 'z-20')
        }"
      >
        <div class="player-circle relative w-11 h-11 rounded-full bg-gradient-to-tr ${
          p.pos === 'GK' ? 'from-amber-600 to-yellow-400' : 'from-indigo-700 to-cyan-500'
        } border-2 ${
          isSwapTarget
            ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse'
            : (isSelected ? 'border-cyan-300 ring-2 ring-cyan-400/60' : 'border-white/90')
        } flex items-center justify-center text-white font-bold text-xs shadow-lg">
          ${p.num}
          <span class="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] px-1 rounded font-mono text-cyan-300">
            ${p.duty}
          </span>
        </div>
        <div class="mt-1 bg-slate-900/95 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-white whitespace-nowrap border ${
          isSwapTarget ? 'border-amber-400 text-amber-300' : (isSelected ? 'border-cyan-400/80 text-cyan-200' : 'border-slate-700/70')
        } shadow">
          <span class="text-cyan-300 font-bold">${p.slotId}</span> • ${p.name.length > 12 ? p.name.slice(0, 12) + '.' : p.name}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = slotsHtml + playersHtml;
}

function selectPlayer(idx: number): void {
  selectedPlayerIdx = idx;
  const p = currentPlayers[idx];
  if (!p) return;

  const shirtEl = document.getElementById("playerShirtNum");
  const titleEl = document.getElementById("playerPosTitle");
  const nameInput = document.getElementById("playerNameInput") as HTMLInputElement | null;
  const dutyBadge = document.getElementById("playerDutyBadge");
  const coordsLabel = document.getElementById("playerCoordsLabel");

  if (shirtEl) shirtEl.innerText = String(p.num);
  if (titleEl) titleEl.innerText = `${p.slotId} (${p.pos}) - ${p.name}`;
  if (nameInput) nameInput.value = p.name;
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
    } else {
      btn.classList.remove("bg-indigo-600", "text-white", "border-indigo-400");
      btn.classList.add("bg-fmDark", "text-slate-300");
    }
  });

  const roleSelect = document.getElementById("playerRoleSelect") as HTMLSelectElement | null;
  if (roleSelect) {
    const availableRoles = ROLES_BY_POS[p.pos] || ["Merkez Oyuncu", "Destek", "Hücum"];
    roleSelect.innerHTML = availableRoles.map((r) => `
      <option value="${r}" ${r === p.role ? "selected" : ""}>${r}</option>
    `).join("");
  }

  renderPitch();
}

function updateActivePlayerName(name: string): void {
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

function updateActivePlayerRole(role: string): void {
  if (currentPlayers[selectedPlayerIdx]) {
    currentPlayers[selectedPlayerIdx].role = role;
    renderPitch();
  }
}

function setPlayerDuty(duty: string): void {
  if (currentPlayers[selectedPlayerIdx]) {
    currentPlayers[selectedPlayerIdx].duty = duty;
    selectPlayer(selectedPlayerIdx);
  }
}

function applyFormation(formationKey: string): void {
  if (FORMATIONS[formationKey]) {
    currentPlayers = JSON.parse(JSON.stringify(FORMATIONS[formationKey]));
    renderPitch();
    selectPlayer(0);
  }
}

function startDrag(e: MouseEvent, idx: number): void {
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

function onDragMove(e: MouseEvent): void {
  if (!isDragging || dragIdx === -1) return;

  const dxPx = e.clientX - dragStartClientX;
  const dyPx = e.clientY - dragStartClientY;
  if (!hasMovedDuringDrag && (dxPx * dxPx + dyPx * dyPx) < 25) {
    // Ignore tiny <5px jitter on simple click so token never jumps off its fixed slot
    return;
  }
  hasMovedDuringDrag = true;

  const pitch = document.getElementById("pitchWrapper");
  if (!pitch) return;

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
    } else {
      coordsLabel.innerText = `Hedef Slot: ${nearestSlot.slotId} (${nearestSlot.label})`;
    }
  }

  renderPitch();
}

function stopDrag(): void {
  if (!isDragging || dragIdx === -1) return;

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
      } else if (draggedPlayer.slotId !== targetSlot.slotId) {
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
