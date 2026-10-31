# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.1] - 2026-10-31
### Fixed
- Player roles are visible beneath all pitch tokens and update when edited. Selecting a player opens the role inspector; manual roles are explicitly distinguished from unreadable FMF role data.
- Removed hash-generated tactic formations, mentalities and instructions; archive metadata remains available and the UI explains unreadable tactic content.
- Best positional rating now follows the player's registered positions; raw position values are visible in the player card.
- Growth history contains only dated observations, including low-CA academy players; same-day reloads replace points and older saves discard future branch points. Baseline reset refreshes the chart immediately.
- Removed synthetic future growth curves and inferred season-start observations. The reader does not expose the exact career start date, so it is explicitly unavailable.
- Development index has a TR/EN information dialog explaining the complete formula and its estimated nature. Comparison labels use neutral wording.

## [3.5.0] - 2026-10-31
### Added
- **Academy / Youth Team Identification:** Every non-senior team is labelled with an inferred level (`U19`, `U18`, `U17`, `Rezerv`, or `Altyapı` fallback) from the player's registered team slot and the squad's age profile. FM saves do not store team names, so the level is derived per club + slot (reserve/B sides are separated by their older age profile).
  - The Scout grid shows a badge next to the club name (e.g. `Beşiktaş A.Ş. U19`).
  - The player detail modal shows the full team label.
  - CSV export gains `Takım (Yaş Grubu)` and `Yaş Grubu` columns.
- **Academy Filter:** New `Altyapı` toggle (`youth_only=true`) lists only youth/reserve players. Club picker suggestions and the active-club banner now show youth counts (e.g. `35 Oyuncu • 9 Altyapı`).
- Deep links: `?tab=scout&club=Beşiktaş&youth=1`.

### Changed
- Club picker now loads up to 5,000 clubs (all 4,138 clubs with players in the tested save) instead of only the first 400, so clubs such as Beşiktaş resolve correctly.
- Optional `FM_PORT` environment variable for the local server (default remains 8765).

## [3.4.0] - 2026-10-31
### Added
- **Settings Panel:** Gear button in the top bar opens a settings modal with appearance and language controls. Preferences are stored in `localStorage` and applied by an inline bootstrap before the first paint, avoiding theme flashes.
- **Multiple Themes:** Dark (default), Light and OLED (pure black). `css/themes.css` maps surfaces, text, borders, inputs, hover states, modals, scrollbars and the Excel grid for the light theme, plus a pure-black OLED variant.
- **TR/EN Localization:** `src/settings.ts` provides a Turkish↔English translator with exact, phrase and composite rules covering static markup as well as dynamically rendered tactics, pitch slot/role labels, scout statuses and messages. Changing the language persists the choice and reloads the app.
- Deep links for testing/sharing: `?theme=light|dark|oled`, `?lang=tr|en`, `?tab=scout`, `?settings=1`.

### Changed
- Project moved to `Desktop/GitHub/Public/Apps/fm-tactic-studio`; the desktop shortcut and launcher now target the new location.
- Removed the obsolete `src/tailwind_theme.ts` / `dist/tailwind_theme.js` (theme config lives in `tailwind.config.js`).

## [3.3.0] - 2026-10-31
### Changed
- **Offline-first Startup (render-blocking CDN removal):** The Tailwind Play CDN (`cdn.tailwindcss.com`, measured at ~11.8 s response time) and the Font Awesome CDN were replaced with locally served assets, so the window no longer waits on the network:
  - Tailwind is precompiled from `css/tailwind.input.css` + `tailwind.config.js` into `dist/tailwind.css` (~35 KB) through the new `npm run build:css` step (also chained into `npm run build`).
  - Font Awesome 6.5.1 CSS and webfonts are vendored under `vendor/fontawesome/` and served by the new `/vendor` static mount.
  - Removed the in-browser Tailwind JIT compiler and the obsolete `dist/tailwind_theme.js`.
- **Faster backend start:** the 16 MB progress snapshot is now lazy-loaded on first use instead of at import time, reducing `scout_engine` import from ~1.07 s to ~0.67 s.

## [3.2.0] - 2026-10-31
### Added
- **Mevkiye Göre Sıralama (Position Ordering):** The `Mevki` column header is now clickable and sorts the squad from goalkeeper to striker (`GK → DC → FB → DM → MC → W/AMC → ST`) or in reverse. Backed by a new `positions_order` rank computed per player from their primary natural position, with `CA DESC` as the tie-breaker and server-side SQL ordering.

## [3.1.0] - 2026-10-31
### Added
- **Player Status Color Coding & Badges:** Player names are now visually colour-coded and badge-annotated based on their real-time status —
  - 🏥 **Sakat (Injured)** → Bright Rose (from global injury database)
  - 🟨 **Cezalı (Suspended)** → Orange (suspension table lookup)
  - ⚡ **Kondisyon Düşük (Low Condition < 73%)** → Amber (matches FM 27 fitness indicator)
  - 📤 **Kirada (Loaned Out)** → Purple with parent-club label
  - ⏳ **Sözleşme Bitiyor (Expiring Contract)** → Cyan (from `transfer_value_state`)
  - F/A **Serbest (Free Agent)** → Dim Slate
- **Status Research:** FM 27 save database (`injuries`, `suspensions`, `raw_condition`, `on_loan`, `transfer_value_state`) fully indexed during save load.

## [3.0.0] - 2026-10-31
### Added
- **Dedicated Type-and-Confirm Club Picker (Kulüp Seçici):** Replaced static dropdown with autocomplete datalist input + confirm/clear buttons to instantly filter full club squads including loaned-out (`Kirada`) and promoted youth players.
- **Positional Suitability Ratings % (`GK..ST`):** Precise percentage calculations for all 8 position groups (`GK, DC, FB, DM, MC, W, AMC, ST`) + Peak Potential Rating (`PA %`).
- **Tactic Pitch "Otomatik En İyi 11 Öner" (Auto-Fill Best XI):** Automatically selects the best squad players for the active tactic's 11 slots, identifies the weakest link position (`En Zayıf Halka`), and recommends 3 global transfer targets from the save.
- **Player comparison chart & Player Comparison:** Interactive polygon comparison overlay (Cyan vs Amber) across 8 attributes (`Savunma, Fiziksel, Sürat, Vizyon, Hücum, Teknik, Hava Topu, Zihinsel`) with side-by-side diff metrics.
- **Shortlist (Takip Listesi) & Scout Notes:** 1-click star bookmarking (`⭐`), shortlist filter toggle, and persistent observation notes with auto-save.
- **Development & Training Speed Index:** Algorithmic development score (`0-99.0`) and tier badge (`S+, A+, A, B, C`) based on age, professionalism, determination, ambition, and injury proneness.
- **Recorded Career Progress Tracker (+1 / +2):** Career baseline (`T0`) snapshotting with live attribute/CA delta tracking (`+1`, `+2`), plus a chart of real dated observations only.
- **Disk Watcher & Instant Save Live-Reload:** Live file modification watcher that detects in-game saves in FM 27 and displays an interactive reload banner.

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
