# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
