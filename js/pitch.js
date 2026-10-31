/**
 * Football Manager 2026 2D Pitch & Drag-and-Drop Controller
 */

let currentPlayers = JSON.parse(JSON.stringify(FORMATIONS["4-2-3-1"]));
let selectedPlayerIdx = 0;
let isDragging = false;
let dragIdx = -1;

function renderPitch() {
  const container = document.getElementById("playersContainer");
  if (!container) return;

  container.innerHTML = currentPlayers.map((p, idx) => {
    const isSelected = selectedPlayerIdx === idx;
    return `
      <div 
        id="playerNode-${idx}" 
        onmousedown="startDrag(event, ${idx})"
        onclick="selectPlayer(${idx})" 
        style="left: ${p.x}%; top: ${p.y}%;"
        class="player-token absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab ${isSelected ? 'selected z-30' : 'z-20'}"
      >
        <div class="relative w-11 h-11 rounded-full bg-gradient-to-tr ${
          p.pos === 'GK' ? 'from-amber-600 to-yellow-400' : 'from-indigo-700 to-cyan-500'
        } border-2 border-white/90 flex items-center justify-center text-white font-bold text-xs shadow-lg">
          ${p.num}
          <span class="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] px-1 rounded font-mono text-cyan-300">
            ${p.duty}
          </span>
        </div>
        <div class="mt-1 bg-slate-900/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap border border-slate-700/60 shadow">
          ${p.pos} • ${p.role.split(' ')[0]}
        </div>
      </div>
    `;
  }).join('');
}

function selectPlayer(idx) {
  selectedPlayerIdx = idx;
  const p = currentPlayers[idx];
  if (!p) return;

  document.getElementById("playerShirtNum").innerText = p.num;
  document.getElementById("playerPosTitle").innerText = `${p.pos} - ${p.name}`;
  document.getElementById("playerNameInput").value = p.name;
  document.getElementById("playerDutyBadge").innerText = p.duty === 'De' ? 'Savunma' : (p.duty === 'Su' ? 'Destek' : (p.duty === 'At' ? 'Hücum' : 'Otomatik'));
  document.getElementById("playerCoordsLabel").innerText = `X: ${Math.round(p.x)}% | Y: ${Math.round(p.y)}%`;

  // Update duty buttons
  document.querySelectorAll(".duty-btn").forEach(btn => {
    if (btn.getAttribute("data-duty") === p.duty) {
      btn.classList.add("bg-indigo-600", "text-white", "border-indigo-400");
      btn.classList.remove("bg-fmDark", "text-slate-300");
    } else {
      btn.classList.remove("bg-indigo-600", "text-white", "border-indigo-400");
      btn.classList.add("bg-fmDark", "text-slate-300");
    }
  });

  // Update role select
  const roleSelect = document.getElementById("playerRoleSelect");
  const availableRoles = ROLES_BY_POS[p.pos] || ["Merkez Oyuncu", "Destek", "Hücum"];
  roleSelect.innerHTML = availableRoles.map(r => `
    <option value="${r}" ${r === p.role ? 'selected' : ''}>${r}</option>
  `).join('');

  renderPitch();
}

function updateActivePlayerName(name) {
  if (currentPlayers[selectedPlayerIdx]) {
    currentPlayers[selectedPlayerIdx].name = name;
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

// Drag and drop mechanics
function startDrag(e, idx) {
  isDragging = true;
  dragIdx = idx;
  selectPlayer(idx);
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", stopDrag);
}

function onDragMove(e) {
  if (!isDragging || dragIdx === -1) return;
  const pitch = document.getElementById("pitchWrapper");
  const rect = pitch.getBoundingClientRect();
  let x = ((e.clientX - rect.left) / rect.width) * 100;
  let y = ((e.clientY - rect.top) / rect.height) * 100;
  
  // Keep tokens safely on pitch
  x = Math.max(8, Math.min(92, x));
  y = Math.max(8, Math.min(88, y));

  currentPlayers[dragIdx].x = Math.round(x);
  currentPlayers[dragIdx].y = Math.round(y);
  
  const node = document.getElementById(`playerNode-${dragIdx}`);
  if (node) {
    node.style.left = `${currentPlayers[dragIdx].x}%`;
    node.style.top = `${currentPlayers[dragIdx].y}%`;
  }
  document.getElementById("playerCoordsLabel").innerText = `X: ${Math.round(x)}% | Y: ${Math.round(y)}%`;
}

function stopDrag() {
  isDragging = false;
  dragIdx = -1;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", stopDrag);
  renderPitch();
}
