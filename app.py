import os
import sys
import csv
import io
import glob
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
from fmf_parser import parse_fmf_file
from scout_engine import scout_engine

app = FastAPI(title="FM Tactic Studio & Universal Scout")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(BASE_DIR, "dist"), exist_ok=True)
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/dist", StaticFiles(directory=os.path.join(BASE_DIR, "dist")), name="dist")
if os.path.exists(os.path.join(BASE_DIR, "js")):
    app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")


def get_default_tactics_dir() -> str:
    env_dir = os.environ.get("FM_TACTICS_DIR")
    if env_dir and os.path.exists(env_dir):
        return env_dir

    local_cfg = os.path.join(BASE_DIR, "config.local.json")
    if os.path.exists(local_cfg):
        try:
            with open(local_cfg, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                if cfg.get("tactics_dir") and os.path.exists(cfg["tactics_dir"]):
                    return cfg["tactics_dir"]
        except OSError as exc:
            sys.stderr.write(f"[Config Read Warning] {exc}\n")

    user_home = os.path.expanduser("~")
    for year in ["27", "26", "2024", "2023", "2022"]:
        candidate = os.path.join(user_home, "Documents", "Sports Interactive", f"Football Manager {year}", "tactics")
        if os.path.exists(candidate):
            return candidate

    fallback = os.path.join(BASE_DIR, "tactics")
    os.makedirs(fallback, exist_ok=True)
    return fallback


DEFAULT_TACTICS_DIR = get_default_tactics_dir()
NOTES_FILE = os.path.join(BASE_DIR, "tactics_data.json")


def load_tactics_data() -> dict:
    if os.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except OSError as exc:
            sys.stderr.write(f"[Tactics Data Warning] {exc}\n")
            return {}
    return {}


def save_tactics_data(data: dict) -> None:
    with open(NOTES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.on_event("startup")
def auto_load_latest_save() -> None:
    saves = scout_engine.list_local_saves()
    if saves:
        try:
            scout_engine.load_save(str(saves[0]["id"]))
        except Exception as exc:
            sys.stderr.write(f"[Scout Startup Warning] {exc}\n")


@app.get("/api/tactics")
def get_tactics(folder: Optional[str] = None):
    target_folder = folder if (folder and folder.strip()) else get_default_tactics_dir()
    if not os.path.exists(target_folder):
        return JSONResponse({"status": "error", "message": f"Klasör bulunamadı: {target_folder}", "tactics": []})

    fmf_files = glob.glob(os.path.join(target_folder, "*.fmf"))
    custom_data = load_tactics_data()

    results = []
    for fpath in fmf_files:
        try:
            parsed = parse_fmf_file(fpath)
            fname = parsed["file_name"]
            if fname in custom_data:
                parsed["saved_notes"] = custom_data[fname].get("notes", "")
                parsed["saved_formation"] = custom_data[fname].get("formation", "4-2-3-1")
                parsed["saved_mentality"] = custom_data[fname].get("mentality", "Pozitif Futbol")
                parsed["saved_players"] = custom_data[fname].get("players", None)
            else:
                parsed["saved_notes"] = ""
                parsed["saved_formation"] = "4-2-3-1"
                parsed["saved_mentality"] = "Pozitif Futbol"
                parsed["saved_players"] = None
            results.append(parsed)
        except Exception as e:
            results.append({
                "file_name": os.path.basename(fpath),
                "file_path": fpath,
                "status": f"Hata: {str(e)}",
                "toc_items": []
            })

    results.sort(key=lambda x: x["file_name"].lower())
    return {
        "status": "ok",
        "current_folder": target_folder,
        "count": len(results),
        "tactics": results
    }


@app.post("/api/save_tactic_details")
def save_details(payload: dict):
    fname = payload.get("file_name")
    if not fname:
        raise HTTPException(status_code=400, detail="Dosya adı zorunludur.")

    data = load_tactics_data()
    data[fname] = {
        "notes": payload.get("notes", ""),
        "formation": payload.get("formation", "4-2-3-1"),
        "mentality": payload.get("mentality", "Pozitif Futbol"),
        "players": payload.get("players", None),
        "instructions": payload.get("instructions", {})
    }
    save_tactics_data(data)
    return {"status": "ok", "message": "Taktik detayları başarıyla kaydedildi."}


@app.post("/api/upload")
async def upload_tactic(file: UploadFile = File(...)):
    save_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    parsed = parse_fmf_file(file_path)
    return {"status": "ok", "tactic": parsed}


# ==================== SCOUT API ENDPOINTS ====================

class LoadSaveRequest(BaseModel):
    save_ref: str


@app.get("/api/saves")
def get_saves():
    raw_saves = scout_engine.list_local_saves()
    public_saves = [
        {
            "id": s["id"],
            "filename": s["filename"],
            "size_mb": s["size_mb"],
            "version_guess": s["version_guess"],
            "is_backup": s["is_backup"]
        }
        for s in raw_saves
    ]
    return {
        "saves": public_saves,
        "active_save": scout_engine.active_save_info if scout_engine.is_loaded else None,
        "is_loaded": scout_engine.is_loaded
    }


@app.post("/api/load-save")
def load_save_endpoint(req: LoadSaveRequest):
    try:
        return scout_engine.load_save(req.save_ref)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/upload-save")
async def upload_save_file(file: UploadFile = File(...)):
    save_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)

    with open(file_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    try:
        return scout_engine.load_save(file_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/players")
def search_players(
    query: str = "",
    name_filter: str = "",
    club_filter: str = "",
    nation_filter: str = "",
    position: str = "",
    min_ca: int = 0,
    max_ca: int = 200,
    min_pa: int = 0,
    max_pa: int = 200,
    min_age: int = 14,
    max_age: int = 55,
    min_consistency: int = 0,
    max_injury_proneness: int = 20,
    min_important_matches: int = 0,
    min_versatility: int = 0,
    min_ambition: int = 0,
    min_professionalism: int = 0,
    min_pressure: int = 0,
    wonderkids_only: bool = False,
    sort_by: str = "pa",
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0
):
    if not scout_engine.is_loaded:
        return {"total": 0, "limit": limit, "offset": offset, "players": [], "is_loaded": False}

    res = scout_engine.db.query_players(
        query=query,
        name_filter=name_filter,
        club_filter=club_filter,
        nation_filter=nation_filter,
        position=position,
        min_ca=min_ca,
        max_ca=max_ca,
        min_pa=min_pa,
        max_pa=max_pa,
        min_age=min_age,
        max_age=max_age,
        min_consistency=min_consistency,
        max_injury_proneness=max_injury_proneness,
        min_important_matches=min_important_matches,
        min_versatility=min_versatility,
        min_ambition=min_ambition,
        min_professionalism=min_professionalism,
        min_pressure=min_pressure,
        wonderkids_only=wonderkids_only,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )
    res["is_loaded"] = True
    return res


@app.get("/api/player/{uid}")
def get_player_detail(uid: int):
    details = scout_engine.db.get_player_details(uid)
    if not details:
        raise HTTPException(status_code=404, detail="Oyuncu bulunamadı")
    return details


@app.get("/api/export-csv")
def export_players_csv(
    query: str = "",
    name_filter: str = "",
    club_filter: str = "",
    nation_filter: str = "",
    position: str = "",
    min_ca: int = 0,
    max_ca: int = 200,
    min_pa: int = 0,
    max_pa: int = 200,
    min_age: int = 14,
    max_age: int = 55,
    min_consistency: int = 0,
    max_injury_proneness: int = 20,
    min_important_matches: int = 0,
    min_versatility: int = 0,
    min_ambition: int = 0,
    min_professionalism: int = 0,
    min_pressure: int = 0,
    wonderkids_only: bool = False,
    sort_by: str = "pa",
    sort_order: str = "desc"
):
    res = scout_engine.db.query_players(
        query=query,
        name_filter=name_filter,
        club_filter=club_filter,
        nation_filter=nation_filter,
        position=position,
        min_ca=min_ca,
        max_ca=max_ca,
        min_pa=min_pa,
        max_pa=max_pa,
        min_age=min_age,
        max_age=max_age,
        min_consistency=min_consistency,
        max_injury_proneness=max_injury_proneness,
        min_important_matches=min_important_matches,
        min_versatility=min_versatility,
        min_ambition=min_ambition,
        min_professionalism=min_professionalism,
        min_pressure=min_pressure,
        wonderkids_only=wonderkids_only,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=2000,
        offset=0
    )
    output = io.StringIO()
    output.write("\ufeff")  # UTF-8 BOM for Excel Turkish character compatibility
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "UID", "Oyuncu Adı", "Yaş", "Mevkiler", "Kulüp", "Ülke",
        "CA", "PA", "Gelişim Farkı (PA-CA)",
        "Tutarlılık", "Önemli Maçlar", "Sakatlık Eğilimi", "Çok Yönlülük", "Çirkeflik",
        "Hırs", "Profesyonellik", "Baskıya Dayanıklılık", "Sadakat", "Uyum", "Sportmenlik", "Mizaç",
        "Sol Ayak", "Sağ Ayak", "Boy (cm)"
    ])
    for p in res["players"]:
        writer.writerow([
            p["uid"], p["name"], p["age"], p["positions"], p["club_name"], p["nation_name"],
            p["ca"], p["pa"], p["potential_gap"],
            p["consistency"], p["important_matches"], p["injury_proneness"], p["versatility"], p["dirtiness"],
            p["ambition"], p["professionalism"], p["pressure"], p["loyalty"], p["adaptability"],
            p["sportsmanship"], p["temperament"],
            p["left_foot"], p["right_foot"], p["height_cm"]
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=fm_scout_export.csv"}
    )


@app.get("/favicon.ico")
def get_favicon():
    return FileResponse(os.path.join(BASE_DIR, "app_icon.ico"))


@app.get("/app_icon.png")
def get_icon():
    return FileResponse(os.path.join(BASE_DIR, "app_icon.png"))


@app.get("/", response_class=HTMLResponse)
def index_page():
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})


def run_server():
    uvicorn.run("app:app", host="127.0.0.1", port=8765, reload=False)


if __name__ == "__main__":
    run_server()
