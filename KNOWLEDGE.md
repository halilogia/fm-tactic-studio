# 🧠 Knowledge Base — Football Manager .FMF Reverse Engineering

## .FMF Container Format Architecture

1. **Header Identification:**
   - Unencrypted archives begin with magic bytes `\x02\x01fmf.\x08\x00\x00`.
   - Encrypted/packaged user tactics begin with magic bytes `\x02\x01afe.\x08\x00\x00` (*Archive File Encrypted*).

2. **File Table of Contents (TOC):**
   - The archive TOC is stored at the end of the file.
   - It begins with the marker `\x02\x01fmf.\x08\x00\x00` followed immediately by the standard Zstandard (zstd) frame magic `\x28\xb5\x2f\xfd` (`0xFD2FB528`).
   - Decompressing this block yields a binary tree describing all packaged files.

3. **TOC Binary Node Layout:**
   - Folder structure:
     `[flag: uint32] [name_len: uint32] [folder_name] [child_count: uint32]`
   - Child file structure:
     `[name_len: uint32] [name] [ext_len: uint32] [ext] [offset: uint64] [compressed_size: uint64] [uncompressed_size: uint64] [ts1: uint64] [ts2: uint64]`

4. **Internal Components of a Tactic Archive:**
   - `[tactic_name].tac`: Encoded match engine formation, positions, player duties, and tactical slider settings.
   - `image.img`: Encoded mini-pitch preview graphic.
   - `_data/details.aom`: Archive metadata and engine identifiers.


## Xbox saves and FMF limits (2026-11-01)

- Local saves use the current user's Documents/Sports Interactive/Football Manager 26 or 27/games. On Windows, resolve the redirected Personal folder and OneDrive variants, rather than assuming a username.
- Xbox PC FM27 can instead store cloud saves in LocalAppData/Packages/SportsInteractive.FootballManager27_*/SystemAppData/wgs. They are indexed, extensionless chunks, not loose .fm files. The observed format is containers.index version 14 and container blob map version 4; numeric entries define concatenation order. Only indexed, complete FMF-header saves are listed.
- Reassembly is read-only with respect to Xbox: stream into a per-user private cache, compare source signatures, atomically replace the cache file, and track the source index/container for reloads. Never rename, edit or move a WGS blob.
- Validated one real FM27 build 27.0.0+2486695 save: 44,606 players at game date 2026-07-23. The third-party reader still marks FM27 semantic fields unconfirmed; archive reconstruction does not validate every player field.
- FMF encrypted tactic payload decoding remains unsupported. The instruction editor is a separately stored manual plan; it never overwrites the FMF or presents manual text as imported data.

References: [SEGA save locations](https://support.sega.com/hc/en-us/articles/19452660515857-Where-can-I-find-my-Football-Manager-save-game-files), [WGS format reference implementation](https://github.com/HarukaMa/palworld-xgp-import/blob/master/container_types.py). Binary layouts were checked against local FM27 containers before use.
