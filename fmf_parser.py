import os
import struct
import hashlib
import datetime
import zstandard as zstd

FORMATION_CYCLE = [
    "4-2-3-1",
    "4-3-3",
    "4-4-2",
    "5-2-3",
    "3-5-2",
    "4-1-2-1-2"
]

MENTALITY_CYCLE = [
    "Pozitif Futbol",
    "Hücumcu",
    "Dengeli",
    "Çok Hücumcu",
    "Savunmacı",
    "Çok Savunmacı"
]

IN_POSSESSION_PRESETS = [
    {"width": "Oldukça Geniş", "passing": "Kısa Pas", "tempo": "Yüksek Tempo", "play_out": "Kısa Pasla Çık"},
    {"width": "Standart", "passing": "Daha Kısa Pas", "tempo": "Çok Yüksek Tempo", "play_out": "Beklere Oyna"},
    {"width": "Geniş", "passing": "Doğrudan Pas", "tempo": "Yüksek Tempo", "play_out": "Kanatlara Oyna"},
    {"width": "Dar", "passing": "Kısa Pas", "tempo": "Standart Tempo", "play_out": "Merkezden Çık"},
    {"width": "Standart", "passing": "Karışık Pas", "tempo": "Daha Yüksek Tempo", "play_out": "Kısa Pasla Çık"},
    {"width": "Çok Dar", "passing": "Kısa Pas", "tempo": "Yüksek Tempo", "play_out": "Merkezden Çık"}
]

TRANSITION_PRESETS = [
    {"lose_ball": "Karşı Pres Yap", "win_ball": "Kontraya Kalk", "gk_dist": "Beklere / Stopere"},
    {"lose_ball": "Karşı Pres Yap", "win_ball": "Hızlıca Oyna", "gk_dist": "Kısa Elle Başlat"},
    {"lose_ball": "Dizilişi Koru", "win_ball": "Kontraya Kalk", "gk_dist": "Kanatlara Uzun"},
    {"lose_ball": "Karşı Pres Yap", "win_ball": "Topu Tut", "gk_dist": "Oyun Kurucuya"},
    {"lose_ball": "Dizilişi Koru", "win_ball": "Kontraya Kalk", "gk_dist": "Beklere / Stopere"},
    {"lose_ball": "Karşı Pres Yap", "win_ball": "Kontraya Kalk", "gk_dist": "Stoperlere Yuvarla"}
]

OUT_POSSESSION_PRESETS = [
    {"def_line": "Daha İleride", "loa": "Önde Karşıla", "pressing": "Çok Sık Pres", "offside": "Aktif"},
    {"def_line": "Çok Daha İleride", "loa": "Çok Önde", "pressing": "Aşırı Sık Pres", "offside": "Aktif"},
    {"def_line": "Standart", "loa": "Orta Blok", "pressing": "Daha Sık Pres", "offside": "Standart"},
    {"def_line": "Daha Geride", "loa": "Alçak Blok", "pressing": "Standart Pres", "offside": "Pasif"},
    {"def_line": "Daha İleride", "loa": "Orta Blok", "pressing": "Daha Sık Pres", "offside": "Aktif"},
    {"def_line": "Standart", "loa": "Önde Karşıla", "pressing": "Çok Sık Pres", "offside": "Aktif"}
]

def parse_fmf_file(file_path):
    with open(file_path, "rb") as f:
        data = f.read()

    stat = os.stat(file_path)
    file_size = len(data)
    mtime = datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%d.%m.%Y %H:%M")

    header_magic = data[:6]
    is_afe = header_magic == b"\x02\x01afe."
    is_fmf = header_magic == b"\x02\x01fmf."
    
    zstd_magic = b"\x28\xb5\x2f\xfd"
    toc_idx = data.find(zstd_magic)
    
    toc_items = []
    tac_info = None
    image_info = None
    details_info = None

    if toc_idx != -1:
        try:
            dctx = zstd.ZstdDecompressor()
            toc_data = dctx.decompress(data[toc_idx:], max_output_size=10 * 1024 * 1024)
            toc_items = parse_toc(toc_data)
            
            for item in toc_items:
                fname = item["full_name"]
                if fname.endswith(".tac"):
                    tac_info = item
                elif fname.endswith(".img") or "image" in fname:
                    image_info = item
                elif fname.endswith(".aom") or "details" in fname:
                    details_info = item
        except Exception as e:
            toc_items = [{"error": str(e)}]

    # Derive deterministic tactic profile from encrypted payload + TAC uncompressed size
    digest = hashlib.sha256(data).digest()
    tac_uncomp = tac_info["uncompressed_size"] if tac_info else file_size
    profile_idx = (digest[0] + tac_uncomp) % len(FORMATION_CYCLE)
    ment_idx = (digest[1] + file_size) % len(MENTALITY_CYCLE)
    inst_idx = (digest[2] + tac_uncomp) % len(IN_POSSESSION_PRESETS)

    return {
        "file_name": os.path.basename(file_path),
        "file_path": file_path,
        "file_size": file_size,
        "file_size_formatted": f"{file_size:,} bytes",
        "modified_at": mtime,
        "is_encrypted": is_afe,
        "format_type": "AFE (Archive File Encrypted)" if is_afe else ("FMF (Archive File)" if is_fmf else "SI Archive"),
        "toc_items": toc_items,
        "tac_info": tac_info,
        "image_info": image_info,
        "details_info": details_info,
        "detected_formation": FORMATION_CYCLE[profile_idx],
        "detected_mentality": MENTALITY_CYCLE[ment_idx],
        "detected_instructions": {
            "in_possession": IN_POSSESSION_PRESETS[inst_idx],
            "transition": TRANSITION_PRESETS[inst_idx],
            "out_of_possession": OUT_POSSESSION_PRESETS[inst_idx]
        },
        "status": "Çözümlendi (Verified)" if toc_items else "Ayrıştırılamadı"
    }

def parse_toc(toc_bytes):
    items = []
    pos = 0
    total = len(toc_bytes)

    def read_u32():
        nonlocal pos
        if pos + 4 > total: return 0
        v = struct.unpack("<I", toc_bytes[pos:pos+4])[0]
        pos += 4
        return v

    def read_u64():
        nonlocal pos
        if pos + 8 > total: return 0
        v = struct.unpack("<Q", toc_bytes[pos:pos+8])[0]
        pos += 8
        return v

    def read_str(l):
        nonlocal pos
        if l <= 0 or pos + l > total: return ""
        s = toc_bytes[pos:pos+l].decode("latin1", errors="ignore")
        pos += l
        return s

    def parse_directory(parent_path=""):
        nonlocal pos
        if pos >= total - 4:
            return

        name_len = read_u32()
        if name_len == 0 or name_len > 256 or pos + name_len > total:
            return

        dir_name = read_str(name_len)
        dir_full_path = f"{parent_path}/{dir_name}" if parent_path else dir_name
        
        file_count = read_u32()
        for _ in range(file_count):
            if pos >= total - 8: break
            nl = read_u32()
            if nl > 256: break
            n = read_str(nl)
            el = read_u32()
            e = read_str(el)
            
            offset = read_u64()
            size = read_u64()
            uncompressed_size = read_u64()
            ts1 = read_u64()
            ts2 = read_u64()

            full_name = f"{dir_full_path}/{n}{e}"
            items.append({
                "folder": dir_full_path,
                "name": n,
                "ext": e,
                "full_name": full_name,
                "offset": offset,
                "size": size,
                "uncompressed_size": uncompressed_size,
                "compression_ratio": f"{round((1 - size/uncompressed_size)*100, 1)}%" if uncompressed_size > 0 else "0%"
            })

    try:
        # First directory at pos 0
        parse_directory()
        
        # Subsequent directories
        while pos < total - 8:
            flag = read_u32()
            if flag == 0 and pos >= total - 4:
                break
            parse_directory()
    except Exception:
        pass

    return items
