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
