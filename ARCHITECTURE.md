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

### 1. Presentation Layer (`src/*.ts` -> `dist/*.js`)
- `index.html`: Clean HTML5 layout skeleton with zero inline JS/CSS (<350 LOC), featuring top-level `Taktik` and `Scout` workspace tabs.
- `css/styles.css`: Pure stylesheet handling pitch markings, grass textures, sticky Excel data-grid headers, and custom scrollbars.
- `src/formations.ts`: Canonical 24 FM 26/27 fixed tactical slots (`FIXED_TACTICAL_SLOTS`), formations database, and role-to-duty mappings.
- `src/pitch.ts`: Fixed-slot 2D tactical pitch controller supporting player swapping on occupied slots and snapping on empty slots.
- `src/scout.ts`: Excel-style data grid controller with inline column filters, sorting, `.fm` save loader, player hidden-attribute modal, and CSV/Excel export.
- `src/app.ts`: Main state orchestrator, workspace switcher, and `.fmf` tactics library manager.
- `src/tailwind_theme.ts`: Externalized Tailwind theme configuration.

### 2. Service & Parsing Layer (`core/`)
- `app.py`: FastAPI async HTTP server serving both Tactic Studio and Universal Scout endpoints.
- `scout_engine.py`: `fmsave` + in-memory SQLite engine indexing 46,000+ players per `.fm` save with <5ms query latency.
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
