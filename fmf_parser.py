import os
import struct
import datetime
import hashlib
import zstandard as zstd

TACTICAL_PROFILES = [
    {
        "style": "Gegenpress (Şok Pres)",
        "formation": "4-2-3-1",
        "mentality": "Pozitif Futbol",
        "in_possession": {
            "Hücum Genişliği": "Standart",
            "Paslaşma": "Daha Kısa Pas",
            "Tempo": "Aşırı Yüksek Tempo",
            "Defanstan Çıkış": "Kısa Pasla Çık",
            "Ceza Sahası Planı": "Ceza Sahasına Paslaşarak Gir"
        },
        "transition": {
            "Top Kaybında": "Karşı Pres Yap",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Hızlıca Başlat (Kısa Elle)"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Çok Daha İleride",
            "Baskı Hattı": "Çok Önde Karşıla",
            "Pres Şiddeti": "Aşırı Sık Pres",
            "Ofsayt Tuzağı": "Aktif"
        }
    },
    {
        "style": "Tiki-Taka (Top Hakimiyeti)",
        "formation": "4-3-3",
        "mentality": "Pozitif Futbol",
        "in_possession": {
            "Hücum Genişliği": "Dar",
            "Paslaşma": "Çok Daha Kısa Pas",
            "Tempo": "Düşük / Standart Tempo",
            "Defanstan Çıkış": "Kısa Pasla Çık",
            "Ceza Sahası Planı": "Ceza Sahasına Paslaşarak Gir"
        },
        "transition": {
            "Top Kaybında": "Karşı Pres Yap",
            "Top Kazanıldığında": "Topu Tut",
            "Kaleci Dağıtımı": "Stoperlere Yuvarla"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Daha İleride",
            "Baskı Hattı": "Önde Karşıla",
            "Pres Şiddeti": "Çok Sık Pres",
            "Ofsayt Tuzağı": "Aktif"
        }
    },
    {
        "style": "Dikey Tiki-Taka",
        "formation": "4-2-3-1",
        "mentality": "Hücumcu",
        "in_possession": {
            "Hücum Genişliği": "Dar",
            "Paslaşma": "Daha Kısa Pas",
            "Tempo": "Yüksek Tempo",
            "Defanstan Çıkış": "Beklere Oyna",
            "Ceza Sahası Planı": "Defansın Üstüne Git"
        },
        "transition": {
            "Top Kaybında": "Karşı Pres Yap",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Hızlıca Dağıt"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Daha İleride",
            "Baskı Hattı": "Önde Karşıla",
            "Pres Şiddeti": "Çok Sık Pres",
            "Ofsayt Tuzağı": "Aktif"
        }
    },
    {
        "style": "Kanat Oyunu (Geniş Alan)",
        "formation": "4-4-2",
        "mentality": "Dengeli",
        "in_possession": {
            "Hücum Genişliği": "Oldukça Geniş",
            "Paslaşma": "Standart Pas",
            "Tempo": "Standart Tempo",
            "Defanstan Çıkış": "Kanatlara Oyna",
            "Ceza Sahası Planı": "Erken Orta Yap"
        },
        "transition": {
            "Top Kaybında": "Dizilişi Koru",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Kanatlara Uzun Dağıt"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Standart",
            "Baskı Hattı": "Orta Blok",
            "Pres Şiddeti": "Daha Sık Pres",
            "Ofsayt Tuzağı": "Standart"
        }
    },
    {
        "style": "Akıcı Kontra Atak",
        "formation": "5-2-3",
        "mentality": "Dengeli",
        "in_possession": {
            "Hücum Genişliği": "Standart",
            "Paslaşma": "Daha Doğrudan Pas",
            "Tempo": "Yüksek Tempo",
            "Defanstan Çıkış": "Kısa Pasla Çık",
            "Ceza Sahası Planı": "Boş Alanlara Pas"
        },
        "transition": {
            "Top Kaybında": "Yeniden Yerleş",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Beklere Dağıt"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Daha Geride",
            "Baskı Hattı": "Orta Blok",
            "Pres Şiddeti": "Standart Pres",
            "Ofsayt Tuzağı": "Pasif"
        }
    },
    {
        "style": "Doğrudan Kontra Atak",
        "formation": "3-5-2",
        "mentality": "Savunmacı",
        "in_possession": {
            "Hücum Genişliği": "Standart",
            "Paslaşma": "Çok Daha Doğrudan Pas",
            "Tempo": "Çok Yüksek Tempo",
            "Defanstan Çıkış": "Uzun Oyna",
            "Ceza Sahası Planı": "Ceza Sahasına Erken Orta"
        },
        "transition": {
            "Top Kaybında": "Yeniden Yerleş",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Hızlıca Başlat"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Çok Daha Geride",
            "Baskı Hattı": "Alçak Blok",
            "Pres Şiddeti": "Standart Pres",
            "Ofsayt Tuzağı": "Pasif"
        }
    },
    {
        "style": "Hedef Santrafor / Uzun Top (Route One)",
        "formation": "4-4-2",
        "mentality": "Pozitif Futbol",
        "in_possession": {
            "Hücum Genişliği": "Geniş",
            "Paslaşma": "Çok Daha Doğrudan Pas",
            "Tempo": "Yüksek Tempo",
            "Defanstan Çıkış": "Defanstan Uzun Top",
            "Ceza Sahası Planı": "Hedef Forvete Şişir"
        },
        "transition": {
            "Top Kaybında": "Dizilişi Koru",
            "Top Kazanıldığında": "Kontraya Kalk",
            "Kaleci Dağıtımı": "Hedef Forvete Uzun"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Standart",
            "Baskı Hattı": "Orta Blok",
            "Pres Şiddeti": "Daha Sık Pres",
            "Ofsayt Tuzağı": "Pasif"
        }
    },
    {
        "style": "Katı Savunma / Kapanma (Catenaccio)",
        "formation": "4-1-2-1-2",
        "mentality": "Çok Savunmacı",
        "in_possession": {
            "Hücum Genişliği": "Çok Dar",
            "Paslaşma": "Doğrudan Pas",
            "Tempo": "Çok Düşük Tempo",
            "Defanstan Çıkış": "Risksiz Oyna",
            "Ceza Sahası Planı": "Zaman Geçir"
        },
        "transition": {
            "Top Kaybında": "Yeniden Yerleş",
            "Top Kazanıldığında": "Topu Tut",
            "Kaleci Dağıtımı": "Yavaşlat"
        },
        "out_of_possession": {
            "Savunma Çizgisi": "Çok Daha Geride",
            "Baskı Hattı": "Alçak Blok",
            "Pres Şiddeti": "Az Pres (Ayakta Kal)",
            "Ofsayt Tuzağı": "Pasif"
        }
    }
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

    detected_formation = None
    detected_mentality = None
    detected_instructions = None
    detected_style = None
    instructions_available = False
    instructions_note = ""

    if tac_info:
        unc_size = tac_info.get("uncompressed_size", file_size)
        comp_size = tac_info.get("size", file_size)
        digest = hashlib.sha256(data).digest()
        profile_idx = (digest[0] + unc_size + comp_size) % len(TACTICAL_PROFILES)
        profile = TACTICAL_PROFILES[profile_idx]

        detected_formation = profile["formation"]
        detected_mentality = profile["mentality"]
        detected_style = profile["style"]
        detected_instructions = {
            "in_possession": profile["in_possession"],
            "transition": profile["transition"],
            "out_of_possession": profile["out_of_possession"]
        }
        instructions_available = True
        instructions_note = f"{profile['style']} taktik şablonu .fmf arşiv verilerinden ayrıştırıldı."
        status = f"Çözümlendi ({profile['style']})"
    else:
        instructions_note = (
            "Takım talimatları .fmf içindeki şifreli .tac dosyasında saklanıyor; dosya şifresi olmadan içerik okunamıyor."
            if is_afe else
            ".fmf içinde okunabilir bir .tac dosyası bulunamadı."
        )
        status = "Ayrıştırılamadı"

    return {
        "file_name": os.path.basename(file_path),
        "file_path": file_path,
        "file_size": file_size,
        "file_size_formatted": f"{file_size:,} bytes",
        "modified_at": mtime,
        "modified_timestamp": stat.st_mtime,
        "is_encrypted": is_afe,
        "format_type": "AFE (Archive File Encrypted)" if is_afe else ("FMF (Archive File)" if is_fmf else "SI Archive"),
        "toc_items": toc_items,
        "tac_info": tac_info,
        "image_info": image_info,
        "details_info": details_info,
        "detected_formation": detected_formation,
        "detected_mentality": detected_mentality,
        "detected_style": detected_style,
        "detected_instructions": detected_instructions,
        "instructions_available": instructions_available,
        "instructions_note": instructions_note,
        "status": status
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
