# 🤖 Agents & Guidelines

## Autonomous Agent Instructions

When maintaining or extending FM Tactic Studio:

1. **Maintain Zero Path Leakage:**
   - Never commit hardcoded user directory paths (%USERPROFILE%, absolute local drive letters).
   - All folder paths must be resolved dynamically at runtime or read from git-ignored `config.local.json`.

2. **Preserve Modularity (SRP):**
   - Keep `index.html` strictly as an HTML skeleton.
   - Place styles in `css/styles.css`.
   - Place tactical formation coordinates in `js/formations.js`.
   - Place pitch coordinate calculations in `js/pitch.js`.
   - Place state and API networking in `js/app.js`.

3. **Safe-Git Adherence:**
   - Never run destructive git commands (`git reset --hard`, `git clean -fd`, `git push --force`).
   - Run verification tests before committing.
