# 🏛️ FM Tactic Studio — Architecture Documentation

## Overview
FM Tactic Studio is a standalone desktop and local-web platform engineered to inspect, visualize, and edit Football Manager tactic (`.fmf` / `.tac`) files without running the game client.

---

## 🧩 Architectural Layers

```
[ Electron Desktop Shell (Chromium) / Web Browser ]
                       │
       HTTP / REST API │ (localhost:8765)
                       ▼
            [ FastAPI Application Core ]
             ├── fmf_parser.py (SI Archive & Zstd TOC Decompressor)
             ├── routes (Tactics, Upload, Settings)
             └── Static Files (/css, /js)
                       │
       Dynamic Discovery│ (config.local.json / FM_TACTICS_DIR / Auto-detect)
                       ▼
        [ Football Manager Tactics Directory ]
             └── *.fmf (AFE Container Archives)
```

### 1. Presentation Layer (`presentation/`)
- `index.html`: Clean, accessible HTML5 layout skeleton (~230 lines).
- `css/styles.css`: Pure stylesheet handling pitch markings, grass textures, responsive player badges, and custom scrollbars.
- `js/formations.js`: Preset database for modern FM tactical shapes (4-2-3-1, 4-3-3, 4-4-2, 5-2-3, etc.) and role-to-duty mappings.
- `js/pitch.js`: 2D interactive canvas/coordinate drag-and-drop controller.
- `js/app.js`: Main state orchestrator, auto-retrying HTTP client, and tab manager.

### 2. Service & Parsing Layer (`core/`)
- `app.py`: FastAPI async HTTP server with CORS protection and local configuration management.
- `fmf_parser.py`: Reverse-engineered Sports Interactive container parser:
  - Header inspection (`\x02\x01afe.` vs `\x02\x01fmf.`)
  - Locate table of contents (TOC) with Zstandard magic bytes (`0xFD2FB528`)
  - Decompresses TOC tree and maps internal archive components (`.tac`, `image.img`, `_data/details.aom`)

### 3. Desktop Runtime (`desktop/`)
- `main.js`: Electron desktop orchestrator featuring Single-Instance Lock, child-process supervisor for the Python runtime, and window lifecycle guards.

---

## 🔒 Privacy & Path Isolation Design
User-specific file paths and personal tactics notes are completely isolated:
- Local directories are read via `config.local.json` (git-ignored) or runtime auto-detection.
- Zero personal identifiers (<user-home>, private machine paths) are stored in tracked repository files.
