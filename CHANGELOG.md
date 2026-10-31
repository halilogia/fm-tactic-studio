# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-31
### Added
- **Unified Top-Level Workspaces (`Taktik` & `Scout (FM 26/27)`):** Integrated Universal Scout directly into FM Tactic Studio with instant tab switching.
- **FM 26 / FM 27 Fixed-Slot Tactical Pitch & Player Swap (`src/formations.ts`, `src/pitch.ts`):** Replaced free-coordinate dragging with FM 26/27's canonical 24 fixed tactical slots (`GK`, `DL..DR`, `WBL..WBR`, `ML..MR`, `AML..AMR`, `STCL..STCR`). Dragging onto an occupied slot swaps the two players; dragging onto an empty slot moves the player into that slot and updates valid roles.
- **Universal Scout Engine & Excel Spreadsheet Grid (`scout_engine.py`, `src/scout.ts`):** Native `.fm` save loader (`fmsave` + in-memory SQLite) with inline Excel-like column filters, multi-column sorting, CA/PA badges, hidden attributes (`Tutarlılık`, `Önemli Maç`, `Sakatlık Eğilimi`, `Çok Yönlülük`, `Çirkeflik`), hidden personality traits (`Hırs`, `Profesyonellik`, `Baskı`, `Sadakat`, `Uyum`), Wonderkids filter, 1-click assignment to tactic board, and UTF-8 BOM CSV/Excel export.
- **TypeScript Architecture Migration:** Migrated frontend application code to `src/*.ts` (`formations.ts`, `pitch.ts`, `scout.ts`, `app.ts`, `tailwind_theme.ts`) compiled cleanly into `dist/*.js`.

## [1.0.0] - 2026-10-31
### Added
- **Reverse-engineered .FMF Parser:** Fully parses SI encrypted container headers and decompresses Zstandard TOC blocks.
- **Interactive 2D Football Pitch:** Drag-and-drop tactical board supporting 11 player tokens, custom positions, roles, and duties.
- **Tactics Library:** Automatically scans Football Manager directories and displays file stats, compression ratios, and modification dates.
- **Tactical Instructions Inspector:** Mentality, in-possession, in-transition, and out-of-possession instructions.
- **Electron Desktop Shell:** Native window launcher (`main.js`, `package.json`) with single instance locking and process management.
- **Desktop Shortcut & Icon:** Multi-resolution `.ico` icon and Windows desktop launcher script (`run.bat`).
- **Privacy & Path Isolation:** Dynamic detection via `config.local.json` and environment variables to ensure zero path leaks in public repos.
- **Modular Frontend Architecture:** Refactored monolithic HTML into `index.html`, `styles.css`, `formations.js`, `pitch.js`, and `app.js`.
