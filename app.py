import os
import glob
import json
import webbrowser
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from fmf_parser import parse_fmf_file

app = FastAPI(title="FM Tactic Studio - Football Manager Taktik Görüntüleyici")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")

def get_default_tactics_dir():
    # 1. Environment variable
    env_dir = os.environ.get("FM_TACTICS_DIR")
    if env_dir and os.path.exists(env_dir):
        return env_dir

    # 2. Local user configuration file (git-ignored)
    local_cfg = os.path.join(BASE_DIR, "config.local.json")
    if os.path.exists(local_cfg):
        try:
            with open(local_cfg, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                if cfg.get("tactics_dir") and os.path.exists(cfg["tactics_dir"]):
                    return cfg["tactics_dir"]
        except Exception:
            pass

    # 3. Standard Football Manager user directories
    user_home = os.path.expanduser("~")
    for year in ["26", "2024", "2023", "2022"]:
        candidate = os.path.join(user_home, "Documents", "Sports Interactive", f"Football Manager {year}", "tactics")
        if os.path.exists(candidate):
            return candidate

    # 4. Fallback to bundled tactics folder
    fallback = os.path.join(BASE_DIR, "tactics")
    os.makedirs(fallback, exist_ok=True)
    return fallback

DEFAULT_TACTICS_DIR = get_default_tactics_dir()

# Load saved notes/custom tactics if exists
NOTES_FILE = os.path.join(BASE_DIR, "tactics_data.json")

def load_tactics_data():
    if os.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_tactics_data(data):
    with open(NOTES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.get("/api/tactics")
def get_tactics(folder: str = None):
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
                parsed["saved_formation"] = custom_data[fname].get("formation", "4-2-3-1 Geniş")
                parsed["saved_mentality"] = custom_data[fname].get("mentality", "Pozitif Futbol")
                parsed["saved_players"] = custom_data[fname].get("players", None)
            else:
                parsed["saved_notes"] = ""
                parsed["saved_formation"] = "4-2-3-1 Geniş"
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

    # Sort alphabetically
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
        "formation": payload.get("formation", "4-2-3-1 Geniş"),
        "mentality": payload.get("mentality", "Pozitif Futbol"),
        "players": payload.get("players", None),
        "instructions": payload.get("instructions", {})
    }
    save_tactics_data(data)
    return {"status": "ok", "message": "Taktik detayları başarıyla kaydedildi."}

@app.post("/api/upload")
async def upload_tactic(file: UploadFile = File(...)):
    save_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    parsed = parse_fmf_file(file_path)
    return {"status": "ok", "tactic": parsed}

@app.get("/favicon.ico")
def get_favicon():
    return FileResponse(os.path.join(os.path.dirname(__file__), "app_icon.ico"))

@app.get("/app_icon.png")
def get_icon():
    return FileResponse(os.path.join(os.path.dirname(__file__), "app_icon.png"))

@app.get("/", response_class=HTMLResponse)
def index_page():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()

def run_server():
    uvicorn.run("app:app", host="127.0.0.1", port=8765, reload=False)

if __name__ == "__main__":
    run_server()
