/**
 * FM Tactic Studio - FM 26/27 Fixed-Slot 2D Tactical Pitch & Swap Drag-and-Drop Controller
 */

let currentPlayers: PlayerToken[] = JSON.parse(JSON.stringify(FORMATIONS["4-2-3-1"]));
let selectedPlayerIdx: number = 0;
let isDragging: boolean = false;
let dragIdx: number = -1;
let hoveredSlotId: string | null = null;
let dragGhostX: number = 50;
let dragGhostY: number = 50;

function ensurePlayerSlotIds(): void {
  currentPlayers.forEach((p) => {
    if (!p.slotId || !FIXED_TACTICAL_SLOTS[p.slotId]) {
      const nearest = findNearestFixedSlot(p.x, p.y);
      p.slotId = nearest.slotId;
      p.pos = nearest.pos;
      p.x = nearest.x;
      p.y = nearest.y;
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

  // 1. Render all 24 canonical FM 26/27 fixed tactical slots
  const occupiedBySlot: Record<string, number> = {};
  currentPlayers.forEach((p, idx) => {
    occupiedBySlot[p.slotId] = idx;
  });

  const slotsHtml = Object.keys(FIXED_TACTICAL_SLOTS).map((slotKey) => {
    const slot = FIXED_TACTICAL_SLOTS[slotKey];
    const occupantIdx = occupiedBySlot[slot.slotId];
    const isOccupied = occupantIdx !== undefined;
    const isHovered = isDragging && hoveredSlotId === slot.slotId;

    const ringClass = isHovered
      ? (isOccupied
          ? "border-amber-400 bg-amber-500/30 scale-125 shadow-lg shadow-amber-500/40"
          : "border-cyan-400 bg-cyan-500/30 scale-125 shadow-lg shadow-cyan-500/40")
      : (isDragging
          ? "border-white/35 bg-slate-950/35 opacity-90"
          : "border-white/15 bg-slate-950/20 opacity-45 hover:opacity-80");

    return `
      <div
        data-slot-id="${slot.slotId}"
        style="left: ${slot.x}%; top: ${slot.y}%;"
        title="${slot.slotId} - ${slot.label}"
        class="tactical-slot absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-dashed flex items-center justify-center transition-all duration-150 pointer-events-none z-10 ${ringClass}"
      >
        <span class="text-[8px] font-mono font-bold ${isHovered ? 'text-white' : 'text-white/60'}">${slot.slotId}</span>
      </div>
    `;
  }).join("");

  // 2. Render 11 player tokens snapped onto their fixed slots (or following cursor while dragging)
  const playersHtml = currentPlayers.map((p, idx) => {
    const isSelected = selectedPlayerIdx === idx;
    const isBeingDragged = isDragging && dragIdx === idx;
    const isSwapTarget = isDragging && dragIdx !== idx && hoveredSlotId === p.slotId;

    const renderX = isBeingDragged ? dragGhostX : p.x;
    const renderY = isBeingDragged ? dragGhostY : p.y;

    return `
      <div 
        id="playerNode-${idx}" 
        onmousedown="startDrag(event, ${idx})"
        onclick="selectPlayer(${idx})" 
        style="left: ${renderX}%; top: ${renderY}%;"
        class="player-token absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab ${
          isBeingDragged ? 'z-40 scale-110 opacity-90 pointer-events-none' : (isSelected ? 'selected z-30' : 'z-20')
        }"
      >
        <div class="relative w-11 h-11 rounded-full bg-gradient-to-tr ${
          p.pos === 'GK' ? 'from-amber-600 to-yellow-400' : 'from-indigo-700 to-cyan-500'
        } border-2 ${
          isSwapTarget ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse' : 'border-white/90'
        } flex items-center justify-center text-white font-bold text-xs shadow-lg">
          ${p.num}
          <span class="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] px-1 rounded font-mono text-cyan-300">
            ${p.duty}
          </span>
        </div>
        <div class="mt-0.5 bg-slate-900/95 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-semibold text-white whitespace-nowrap border ${
          isSwapTarget ? 'border-amber-400 text-amber-300' : 'border-slate-700/70'
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

// Fixed-Slot & Swap Drag-and-Drop Mechanics
function startDrag(e: MouseEvent, idx: number): void {
  e.preventDefault();
  e.stopPropagation();
  isDragging = true;
  dragIdx = idx;
  selectedPlayerIdx = idx;
  const p = currentPlayers[idx];
  dragGhostX = p.x;
  dragGhostY = p.y;
  hoveredSlotId = p.slotId;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", stopDrag);
  renderPitch();
}

function onDragMove(e: MouseEvent): void {
  if (!isDragging || dragIdx === -1) return;
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

  const draggedPlayer = currentPlayers[dragIdx];
  const targetSlotId = hoveredSlotId || draggedPlayer.slotId;
  const targetSlot = FIXED_TACTICAL_SLOTS[targetSlotId];

  if (targetSlot && draggedPlayer) {
    const existingIdx = currentPlayers.findIndex((p, i) => i !== dragIdx && p.slotId === targetSlot.slotId);

    if (existingIdx !== -1) {
      // Occupied slot -> Swap the two players' identities (name & shirt number) while keeping tactical slot structure intact,
      // OR if dragging to swap slots, swap their slot positions and adapt roles if needed.
      const otherPlayer = currentPlayers[existingIdx];
      const tempName = draggedPlayer.name;
      const tempNum = draggedPlayer.num;

      draggedPlayer.name = otherPlayer.name;
      draggedPlayer.num = otherPlayer.num;

      otherPlayer.name = tempName;
      otherPlayer.num = tempNum;

      selectedPlayerIdx = existingIdx;
    } else if (draggedPlayer.slotId !== targetSlot.slotId) {
      // Empty fixed slot -> Move player into that canonical FM 26/27 slot
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

  isDragging = false;
  dragIdx = -1;
  hoveredSlotId = null;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", stopDrag);

  selectPlayer(selectedPlayerIdx);
}
