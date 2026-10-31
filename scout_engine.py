"""
FM Universal Scout & Tactic Studio — Core Save Ingestion, Positional Rating %,
Development Speed Index, Auto-Best XI, Shortlist & Baseline Progress Tracker Engine.
"""

from __future__ import annotations
import os
import sys
import json
import sqlite3
import datetime
from typing import List, Dict, Any, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception as exc:
        sys.stderr.write(f"[Scout UTF8 Warning] {exc}\n")

try:
    import fmsave
    FMSAVE_AVAILABLE = True
except ImportError:
    FMSAVE_AVAILABLE = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHORTLIST_FILE = os.path.join(BASE_DIR, "shortlist_data.json")
SNAPSHOTS_FILE = os.path.join(BASE_DIR, "progress_snapshots.json")

# FM Genie Scout Positional Weight Profiles
POSITION_WEIGHTS: Dict[str, List[Tuple[str, float]]] = {
    "GK": [
        ("reflexes", 3.2), ("handling", 2.8), ("one_on_ones", 2.4),
        ("positioning", 2.4), ("aerial_reach", 2.2), ("command_of_area", 2.0),
        ("decisions", 2.0), ("composure", 1.6), ("agility", 1.8), ("concentration", 1.8)
    ],
    "DC": [
        ("tackling", 3.0), ("marking", 3.0), ("positioning", 3.0),
        ("heading", 2.5), ("jumping_reach", 2.5), ("strength", 2.4),
        ("decisions", 2.2), ("anticipation", 2.2), ("composure", 1.8),
        ("pace", 1.8), ("bravery", 1.6), ("concentration", 1.8)
    ],
    "FB": [
        ("pace", 2.8), ("acceleration", 2.6), ("stamina", 2.6),
        ("tackling", 2.5), ("marking", 2.0), ("positioning", 2.2),
        ("crossing", 2.4), ("work_rate", 2.4), ("decisions", 2.0),
        ("dribbling", 1.7), ("passing", 1.8), ("anticipation", 1.8)
    ],
    "DM": [
        ("tackling", 2.8), ("positioning", 2.8), ("decisions", 2.6),
        ("passing", 2.5), ("work_rate", 2.5), ("teamwork", 2.3),
        ("stamina", 2.2), ("anticipation", 2.4), ("composure", 2.2),
        ("strength", 2.0), ("first_touch", 1.9), ("vision", 1.8)
    ],
    "MC": [
        ("passing", 3.0), ("decisions", 2.7), ("vision", 2.6),
        ("first_touch", 2.5), ("technique", 2.4), ("work_rate", 2.4),
        ("stamina", 2.3), ("teamwork", 2.2), ("composure", 2.2),
        ("off_the_ball", 2.0), ("tackling", 1.8), ("anticipation", 2.0)
    ],
    "W": [
        ("pace", 3.0), ("acceleration", 3.0), ("dribbling", 2.9),
        ("technique", 2.6), ("crossing", 2.5), ("first_touch", 2.4),
        ("off_the_ball", 2.4), ("agility", 2.4), ("flair", 2.0),
        ("passing", 1.9), ("finishing", 1.8), ("decisions", 1.9)
    ],
    "AMC": [
        ("vision", 3.0), ("passing", 2.9), ("technique", 2.8),
        ("first_touch", 2.7), ("decisions", 2.5), ("dribbling", 2.5),
        ("off_the_ball", 2.5), ("composure", 2.3), ("flair", 2.2),
        ("agility", 2.0), ("finishing", 1.9), ("long_shots", 1.8)
    ],
    "ST": [
        ("finishing", 3.2), ("composure", 2.8), ("off_the_ball", 2.8),
        ("first_touch", 2.5), ("acceleration", 2.5), ("pace", 2.4),
        ("decisions", 2.2), ("anticipation", 2.4), ("technique", 2.2),
        ("dribbling", 2.0), ("heading", 1.9), ("strength", 1.9)
    ]
}


def compute_positional_ratings(
    attr_dict: Dict[str, int],
    ca: int,
    pa: int,
    consistency: int,
    important_matches: int
) -> Tuple[Dict[str, float], str, float, float]:
    """Calculates FM Genie Scout style Positional Ratings (%) and Peak Potential Rating (%)."""
    ratings: Dict[str, float] = {}
    hidden_bonus = ((consistency - 10) * 0.22) + ((important_matches - 10) * 0.18)
    ca_bonus = (ca / 200.0) * 8.0

    best_pos = "MC"
    best_score = 0.0

    for pos_key, weights in POSITION_WEIGHTS.items():
        total_w = 0.0
        weighted_sum = 0.0
        for attr_name, w in weights:
            val = attr_dict.get(attr_name, 10)
            weighted_sum += val * w
            total_w += w
        if total_w > 0:
            raw_pct = (weighted_sum / (total_w * 20.0)) * 100.0
            final_rating = round(min(99.4, max(30.0, raw_pct + hidden_bonus + (ca_bonus * 0.4))), 1)
            ratings[pos_key] = final_rating
            if final_rating > best_score:
                best_score = final_rating
                best_pos = pos_key

    potential_gap = max(0, pa - ca)
    potential_growth_rating = round(min(99.8, best_score + (potential_gap * 0.32)), 1)

    return ratings, best_pos, best_score, potential_growth_rating


def compute_development_index(
    age: int,
    ca: int,
    pa: int,
    professionalism: int,
    ambition: int,
    determination: int,
    injury_proneness: int
) -> Tuple[float, str]:
    """
    Computes FM Genie Scout style Training & Development Speed Index (0-99.0) and Tier (S+, A+, A, B, C).
    """
    gap = max(0, pa - ca)
    if gap <= 0 or age >= 33:
        return 0.0, "C"

    # Age multiplier (peak growth is 16-21)
    if age <= 18:
        age_mult = 1.35
    elif age <= 21:
        age_mult = 1.25
    elif age <= 24:
        age_mult = 1.05
    elif age <= 27:
        age_mult = 0.75
    elif age <= 30:
        age_mult = 0.40
    else:
        age_mult = 0.15

    mental_drive = (professionalism * 0.45) + (determination * 0.35) + (ambition * 0.20)
    injury_penalty = max(0.0, (injury_proneness - 10) * 1.5)
    raw_score = ((mental_drive / 20.0) * 70.0 + min(30.0, gap * 0.65) - injury_penalty) * age_mult
    dev_score = round(min(99.0, max(5.0, raw_score)), 1)

    if dev_score >= 85.0:
        tier = "S+"
    elif dev_score >= 72.0:
        tier = "A+"
    elif dev_score >= 58.0:
        tier = "A"
    elif dev_score >= 40.0:
        tier = "B"
    else:
        tier = "C"

    return dev_score, tier


def compute_octagon_scores(attr_dict: Dict[str, int], is_gk: bool = False) -> Dict[str, float]:
    """Generates 8-axis polygon/radar attributes for in-depth player comparison (0-20 scale)."""
    def avg(keys: List[str]) -> float:
        vals = [attr_dict.get(k, 10) for k in keys if k in attr_dict]
        return round(sum(vals) / len(vals), 1) if vals else 10.0

    if is_gk:
        return {
            "Savunma": avg(["positioning", "command_of_area"]),
            "Fiziksel": avg(["agility", "strength", "natural_fitness"]),
            "Sürat": avg(["acceleration", "pace", "agility"]),
            "Vizyon": avg(["vision", "passing"]),
            "Hücum": avg(["decisions", "composure"]),
            "Teknik": avg(["handling", "first_touch", "passing"]),
            "Hava Topu": avg(["aerial_reach", "jumping_reach"]),
            "Zihinsel": avg(["concentration", "composure", "decisions", "anticipation"])
        }

    return {
        "Savunma": avg(["tackling", "marking", "positioning"]),
        "Fiziksel": avg(["stamina", "strength", "balance", "natural_fitness"]),
        "Sürat": avg(["pace", "acceleration", "agility"]),
        "Vizyon": avg(["vision", "passing", "flair"]),
        "Hücum": avg(["finishing", "composure", "off_the_ball"]),
        "Teknik": avg(["dribbling", "first_touch", "technique", "crossing"]),
        "Hava Topu": avg(["heading", "jumping_reach", "bravery"]),
        "Zihinsel": avg(["decisions", "anticipation", "work_rate", "teamwork", "determination"])
    }


def get_candidate_save_dirs() -> List[str]:
    """Returns candidate FM save directories prioritizing official Documents\\Sports Interactive first."""
    dirs: List[str] = []

    env_dir = os.environ.get("FM_SAVES_DIR")
    if env_dir and os.path.exists(env_dir):
        dirs.append(env_dir)

    user_home = os.path.expanduser("~")
    for ver in ("27", "2027", "26", "2026", "2024", "24"):
        for sub in ("games", "cloud", "Temporary"):
            cand_doc = os.path.join(user_home, "Documents", "Sports Interactive", f"Football Manager {ver}", sub)
            if os.path.exists(cand_doc):
                dirs.append(cand_doc)
            cand_appdata = os.path.join(user_home, "AppData", "Local", "Sports Interactive", f"Football Manager {ver}", sub)
            if os.path.exists(cand_appdata):
                dirs.append(cand_appdata)

    local_cfg = os.path.join(BASE_DIR, "config.local.json")
    if os.path.exists(local_cfg):
        try:
            with open(local_cfg, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                for key in ("saves_dir", "saves_dirs"):
                    val = cfg.get(key)
                    if isinstance(val, str) and os.path.exists(val):
                        dirs.append(val)
                    elif isinstance(val, list):
                        for item in val:
                            if isinstance(item, str) and os.path.exists(item):
                                dirs.append(item)
                tac_dir = cfg.get("tactics_dir")
                if isinstance(tac_dir, str) and os.path.exists(tac_dir):
                    parent_fm = os.path.dirname(tac_dir.rstrip("\\/"))
                    sibling_games = os.path.join(parent_fm, "games")
                    if os.path.exists(sibling_games):
                        dirs.append(sibling_games)
        except OSError as exc:
            sys.stderr.write(f"[Scout Config Warning] {exc}\n")

    uploads_dir = os.path.join(BASE_DIR, "uploads")
    if os.path.exists(uploads_dir):
        dirs.append(uploads_dir)

    unique_dirs: List[str] = []
    seen = set()
    for d in dirs:
        norm = os.path.normcase(os.path.abspath(d))
        if norm not in seen:
            seen.add(norm)
            unique_dirs.append(d)
    return unique_dirs


class ScoutDatabase:
    """In-memory SQLite database for high-performance player filtering, sorting, and Excel export."""

    def __init__(self) -> None:
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.player_details_cache: Dict[int, Dict[str, Any]] = {}
        self._init_schema()

    def _init_schema(self) -> None:
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                uid INTEGER PRIMARY KEY,
                name TEXT,
                age INTEGER,
                ca INTEGER,
                pa INTEGER,
                potential_gap INTEGER,
                ca_delta INTEGER,
                best_rating REAL,
                pot_rating REAL,
                best_pos TEXT,
                dev_score REAL,
                dev_tier TEXT,
                club_name TEXT,
                loan_parent_club_name TEXT,
                contract_club_name TEXT,
                is_on_loan INTEGER,
                nation_name TEXT,
                positions TEXT,
                natural_positions TEXT,
                left_foot INTEGER,
                right_foot INTEGER,
                height_cm INTEGER,
                transfer_value INTEGER,
                wage INTEGER,
                contract_end_year INTEGER,
                contract_end_str TEXT,
                status_code INTEGER,
                status_label TEXT,
                consistency INTEGER,
                important_matches INTEGER,
                injury_proneness INTEGER,
                dirtiness INTEGER,
                versatility INTEGER,
                ambition INTEGER,
                loyalty INTEGER,
                pressure INTEGER,
                professionalism INTEGER,
                sportsmanship INTEGER,
                temperament INTEGER,
                controversy INTEGER,
                adaptability INTEGER
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ca ON players(ca)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pa ON players(pa)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_best_rating ON players(best_rating)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dev_score ON players(dev_score)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_age ON players(age)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_name ON players(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_club ON players(club_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_parent_club ON players(loan_parent_club_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contract_club ON players(contract_club_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_consistency ON players(consistency)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_injury ON players(injury_proneness)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contract_year ON players(contract_end_year)")
        self.conn.commit()

    def clear(self) -> None:
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM players")
        self.conn.commit()
        self.player_details_cache.clear()

    def insert_players_batch(self, player_records: List[Dict[str, Any]]) -> None:
        cursor = self.conn.cursor()
        cursor.execute("BEGIN TRANSACTION")
        insert_sql = """
            INSERT OR REPLACE INTO players (
                uid, name, age, ca, pa, potential_gap, ca_delta,
                best_rating, pot_rating, best_pos, dev_score, dev_tier,
                club_name, loan_parent_club_name, contract_club_name, is_on_loan, nation_name,
                positions, natural_positions, left_foot, right_foot,
                height_cm, transfer_value, wage, contract_end_year, contract_end_str,
                status_code, status_label,
                consistency, important_matches,
                injury_proneness, dirtiness, versatility, ambition,
                loyalty, pressure, professionalism, sportsmanship,
                temperament, controversy, adaptability
            ) VALUES (
                :uid, :name, :age, :ca, :pa, :potential_gap, :ca_delta,
                :best_rating, :pot_rating, :best_pos, :dev_score, :dev_tier,
                :club_name, :loan_parent_club_name, :contract_club_name, :is_on_loan, :nation_name,
                :positions, :natural_positions, :left_foot, :right_foot,
                :height_cm, :transfer_value, :wage, :contract_end_year, :contract_end_str,
                :status_code, :status_label,
                :consistency, :important_matches,
                :injury_proneness, :dirtiness, :versatility, :ambition,
                :loyalty, :pressure, :professionalism, :sportsmanship,
                :temperament, :controversy, :adaptability
            )
        """
        cursor.executemany(insert_sql, player_records)
        self.conn.commit()

    def list_clubs(self, limit: int = 600) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        # Include clubs where players are currently playing or owned
        cursor.execute("""
            SELECT club_name, COUNT(*) as player_count, ROUND(AVG(ca), 1) as avg_ca, MAX(pa) as max_pa
            FROM players
            WHERE club_name != '' AND club_name NOT LIKE '%Serbest%'
            GROUP BY club_name
            ORDER BY club_name COLLATE NOCASE ASC
            LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

    def query_players(
        self,
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
        min_best_rating: float = 0.0,
        min_dev_score: float = 0.0,
        min_consistency: int = 0,
        max_injury_proneness: int = 20,
        min_important_matches: int = 0,
        min_versatility: int = 0,
        min_ambition: int = 0,
        min_professionalism: int = 0,
        min_pressure: int = 0,
        max_contract_year: int = 0,
        free_agents_only: bool = False,
        wonderkids_only: bool = False,
        shortlist_uids: Optional[List[int]] = None,
        sort_by: str = "pa",
        sort_order: str = "desc",
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        where_clauses = [
            "ca >= ?", "ca <= ?",
            "pa >= ?", "pa <= ?",
            "age >= ?", "age <= ?",
            "best_rating >= ?",
            "dev_score >= ?",
            "consistency >= ?",
            "injury_proneness <= ?",
            "important_matches >= ?",
            "versatility >= ?",
            "ambition >= ?",
            "professionalism >= ?",
            "pressure >= ?"
        ]
        params: List[Any] = [
            min_ca, max_ca,
            min_pa, max_pa,
            min_age, max_age,
            min_best_rating,
            min_dev_score,
            min_consistency,
            max_injury_proneness,
            min_important_matches,
            min_versatility,
            min_ambition,
            min_professionalism,
            min_pressure
        ]

        if shortlist_uids is not None:
            if len(shortlist_uids) == 0:
                return {"total": 0, "limit": limit, "offset": offset, "players": []}
            placeholders = ",".join(["?"] * len(shortlist_uids))
            where_clauses.append(f"uid IN ({placeholders})")
            params.extend(shortlist_uids)

        if wonderkids_only:
            where_clauses.append("age <= 21 AND pa >= 150")

        if free_agents_only:
            where_clauses.append("club_name LIKE '%Serbest%'")

        if max_contract_year > 0:
            where_clauses.append("(contract_end_year > 0 AND contract_end_year <= ?)")
            params.append(max_contract_year)

        if query.strip():
            where_clauses.append("(name LIKE ? OR club_name LIKE ? OR loan_parent_club_name LIKE ? OR contract_club_name LIKE ? OR nation_name LIKE ?)")
            q_like = f"%{query.strip()}%"
            params.extend([q_like, q_like, q_like, q_like, q_like])

        if name_filter.strip():
            where_clauses.append("name LIKE ?")
            params.append(f"%{name_filter.strip()}%")

        if club_filter.strip():
            # Comprehensive club filter: matches active club, loan parent club, or owning contract club
            where_clauses.append("(club_name LIKE ? OR loan_parent_club_name LIKE ? OR contract_club_name LIKE ?)")
            c_like = f"%{club_filter.strip()}%"
            params.extend([c_like, c_like, c_like])

        if nation_filter.strip():
            where_clauses.append("nation_name LIKE ?")
            params.append(f"%{nation_filter.strip()}%")

        if position.strip():
            where_clauses.append("positions LIKE ?")
            params.append(f"%{position.strip().upper()}%")

        where_sql = " AND ".join(where_clauses)

        allowed_sorts = {
            "pa": "pa", "ca": "ca", "potential_gap": "potential_gap", "ca_delta": "ca_delta",
            "best_rating": "best_rating", "pot_rating": "pot_rating",
            "dev_score": "dev_score", "age": "age", "name": "name",
            "club_name": "club_name", "nation_name": "nation_name",
            "consistency": "consistency", "important_matches": "important_matches",
            "injury_proneness": "injury_proneness", "versatility": "versatility",
            "dirtiness": "dirtiness", "ambition": "ambition",
            "professionalism": "professionalism", "pressure": "pressure",
            "loyalty": "loyalty", "transfer_value": "transfer_value",
            "wage": "wage", "contract_end_year": "contract_end_year"
        }
        safe_sort = allowed_sorts.get(sort_by.lower(), "pa")
        safe_order = "ASC" if sort_order.lower() == "asc" else "DESC"

        cursor = self.conn.cursor()
        count_sql = f"SELECT COUNT(*) FROM players WHERE {where_sql}"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()[0]

        select_sql = f"""
            SELECT uid, name, age, ca, pa, potential_gap, ca_delta,
                   best_rating, pot_rating, best_pos, dev_score, dev_tier,
                   club_name, loan_parent_club_name, contract_club_name, is_on_loan, nation_name,
                   positions, natural_positions, left_foot, right_foot,
                   height_cm, transfer_value, wage, contract_end_year, contract_end_str,
                   status_code, status_label,
                   consistency, important_matches,
                   injury_proneness, dirtiness, versatility, ambition,
                   loyalty, pressure, professionalism, sportsmanship,
                   temperament, controversy, adaptability
            FROM players
            WHERE {where_sql}
            ORDER BY {safe_sort} {safe_order}
            LIMIT ? OFFSET ?
        """
        query_params = list(params) + [limit, offset]
        cursor.execute(select_sql, query_params)
        rows = [dict(r) for r in cursor.fetchall()]

        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "players": rows
        }

    def get_player_details(self, uid: int) -> Optional[Dict[str, Any]]:
        return self.player_details_cache.get(uid)


class UniversalScoutEngine:
    """Orchestrates FM 26 & FM 27 save game discovery, loading, baseline snapshots, shortlist, and auto-XI."""

    def __init__(self) -> None:
        self.db = ScoutDatabase()
        self.active_save_info: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.loaded_save_path: Optional[str] = None
        self.loaded_save_mtime: float = 0.0
        self.shortlist: Dict[str, Dict[str, Any]] = self._load_json_file(SHORTLIST_FILE)
        self.snapshots: Dict[str, Any] = self._load_json_file(SNAPSHOTS_FILE)

    def _load_json_file(self, path: str) -> Dict[str, Any]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except OSError as exc:
                sys.stderr.write(f"[Scout JSON Read Warning] {exc}\n")
        return {}

    def _save_json_file(self, path: str, data: Dict[str, Any]) -> None:
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except OSError as exc:
            sys.stderr.write(f"[Scout JSON Write Warning] {exc}\n")

    # ==================== SAVE STATUS & DISK WATCHER ====================
    def check_save_status(self) -> Dict[str, Any]:
        """Checks if the loaded .fm file has been modified on disk since it was loaded."""
        if not self.loaded_save_path or not os.path.exists(self.loaded_save_path):
            return {"has_update": False, "is_loaded": self.is_loaded}
        
        current_mtime = os.path.getmtime(self.loaded_save_path)
        has_update = current_mtime > (self.loaded_save_mtime + 1.0)
        
        disk_time_str = datetime.datetime.fromtimestamp(current_mtime).strftime("%H:%M:%S")
        loaded_time_str = datetime.datetime.fromtimestamp(self.loaded_save_mtime).strftime("%H:%M:%S") if self.loaded_save_mtime else "-"
        
        return {
            "has_update": has_update,
            "is_loaded": self.is_loaded,
            "disk_mtime": current_mtime,
            "loaded_mtime": self.loaded_save_mtime,
            "disk_time_str": disk_time_str,
            "loaded_time_str": loaded_time_str,
            "file_name": os.path.basename(self.loaded_save_path)
        }

    def reload_current_save(self) -> Dict[str, Any]:
        """Reloads the active save fresh from disk to catch in-game promotions, saves, or transfers."""
        if not self.loaded_save_path:
            saves = self.list_local_saves()
            if not saves:
                raise RuntimeError("Yüklenecek FM save dosyası bulunamadı.")
            return self.load_save(str(saves[0]["id"]))
        return self.load_save(self.loaded_save_path)

    # ==================== SHORTLIST MANAGEMENT ====================
    def get_shortlist_items(self) -> List[Dict[str, Any]]:
        items = []
        for uid_str, meta in self.shortlist.items():
            uid = int(uid_str)
            p = self.db.get_player_details(uid)
            if p:
                items.append({
                    "uid": uid,
                    "name": p["name"],
                    "age": p["age"],
                    "club_name": p["club_name"],
                    "loan_parent_club_name": p.get("loan_parent_club_name", ""),
                    "is_on_loan": p.get("is_on_loan", 0),
                    "ca": p["ca"],
                    "pa": p["pa"],
                    "best_rating": p["best_rating"],
                    "best_pos": p["best_pos"],
                    "dev_tier": p["dev_tier"],
                    "note": meta.get("note", ""),
                    "added_at": meta.get("added_at", "")
                })
            else:
                items.append({
                    "uid": uid,
                    "name": meta.get("name", f"UID #{uid}"),
                    "age": meta.get("age", 0),
                    "club_name": meta.get("club_name", "-"),
                    "ca": meta.get("ca", 0),
                    "pa": meta.get("pa", 0),
                    "best_rating": meta.get("best_rating", 0),
                    "best_pos": meta.get("best_pos", "-"),
                    "dev_tier": meta.get("dev_tier", "-"),
                    "note": meta.get("note", ""),
                    "added_at": meta.get("added_at", "")
                })
        return items

    def update_shortlist(self, uid: int, action: str = "toggle", note: str = "") -> Dict[str, Any]:
        uid_str = str(uid)
        p = self.db.get_player_details(uid)
        if action == "remove" or (action == "toggle" and uid_str in self.shortlist and not note):
            self.shortlist.pop(uid_str, None)
            self._save_json_file(SHORTLIST_FILE, self.shortlist)
            if p:
                p["in_shortlist"] = False
            return {"in_shortlist": False, "count": len(self.shortlist)}

        existing = self.shortlist.get(uid_str, {})
        self.shortlist[uid_str] = {
            "uid": uid,
            "name": p["name"] if p else existing.get("name", ""),
            "age": p["age"] if p else existing.get("age", 0),
            "club_name": p["club_name"] if p else existing.get("club_name", ""),
            "ca": p["ca"] if p else existing.get("ca", 0),
            "pa": p["pa"] if p else existing.get("pa", 0),
            "best_rating": p["best_rating"] if p else existing.get("best_rating", 0),
            "best_pos": p["best_pos"] if p else existing.get("best_pos", ""),
            "dev_tier": p["dev_tier"] if p else existing.get("dev_tier", ""),
            "note": note if note else existing.get("note", ""),
            "added_at": existing.get("added_at", datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
        }
        self._save_json_file(SHORTLIST_FILE, self.shortlist)
        if p:
            p["in_shortlist"] = True
            p["shortlist_note"] = self.shortlist[uid_str]["note"]
        return {"in_shortlist": True, "count": len(self.shortlist), "note": self.shortlist[uid_str]["note"]}

    # ==================== PLAYER COMPARISON (RADAR / OCTAGON) ====================
    def compare_players(self, uid1: int, uid2: int) -> Dict[str, Any]:
        p1 = self.db.get_player_details(uid1)
        p2 = self.db.get_player_details(uid2)
        if not p1 or not p2:
            return {"status": "error", "message": "Karşılaştırılacak oyunculardan biri bulunamadı."}

        axes = ["Savunma", "Fiziksel", "Sürat", "Vizyon", "Hücum", "Teknik", "Hava Topu", "Zihinsel"]
        oct1 = p1.get("octagon", {})
        oct2 = p2.get("octagon", {})

        comparison = []
        for ax in axes:
            v1 = float(oct1.get(ax, 10.0))
            v2 = float(oct2.get(ax, 10.0))
            diff = round(v1 - v2, 1)
            comparison.append({
                "axis": ax,
                "p1_val": v1,
                "p2_val": v2,
                "winner": "p1" if v1 > v2 else ("p2" if v2 > v1 else "draw"),
                "diff": diff
            })

        return {
            "status": "ok",
            "player1": {
                "uid": p1["uid"], "name": p1["name"], "age": p1["age"],
                "club_name": p1["club_name"], "positions": p1.get("positions", []),
                "ca": p1["ca"], "pa": p1["pa"],
                "best_rating": p1["best_rating"], "best_pos": p1["best_pos"],
                "dev_tier": p1["dev_tier"], "dev_score": p1["dev_score"],
                "octagon": oct1,
                "hidden": p1.get("hidden", {}),
                "personality": p1.get("personality", {})
            },
            "player2": {
                "uid": p2["uid"], "name": p2["name"], "age": p2["age"],
                "club_name": p2["club_name"], "positions": p2.get("positions", []),
                "ca": p2["ca"], "pa": p2["pa"],
                "best_rating": p2["best_rating"], "best_pos": p2["best_pos"],
                "dev_tier": p2["dev_tier"], "dev_score": p2["dev_score"],
                "octagon": oct2,
                "hidden": p2.get("hidden", {}),
                "personality": p2.get("personality", {})
            },
            "comparison": comparison
        }

    # ==================== AUTO-FILL BEST XI & TRANSFER TARGET FINDER ====================
    def recommend_best_xi(self, club_name: str, slots: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Finds the best squad player for each tactical slot and recommends global upgrades for the weakest slot."""
        cursor = self.db.conn.cursor()
        if club_name and club_name.strip():
            cursor.execute("""
                SELECT uid FROM players 
                WHERE (club_name LIKE ? OR loan_parent_club_name LIKE ? OR contract_club_name LIKE ?) 
                ORDER BY ca DESC LIMIT 100
            """, (f"%{club_name.strip()}%", f"%{club_name.strip()}%", f"%{club_name.strip()}%"))
        else:
            cursor.execute("SELECT uid FROM players ORDER BY ca DESC LIMIT 100")
        candidate_uids = [r[0] for r in cursor.fetchall()]

        used_uids = set()
        assigned_slots = []
        weakest_slot = None
        weakest_score = 999.0

        pos_group_map = {
            "GK": "GK", "DL": "FB", "DR": "FB", "WBL": "FB", "WBR": "FB",
            "DC": "DC", "DCL": "DC", "DCR": "DC",
            "DM": "DM", "DMC": "DM", "DMCL": "DM", "DMCR": "DM",
            "MC": "MC", "MCL": "MC", "MCR": "MC",
            "ML": "W", "MR": "W", "AML": "W", "AMR": "W",
            "AMC": "AMC", "AMCL": "AMC", "AMCR": "AMC",
            "ST": "ST", "STC": "ST", "STCL": "ST", "STCR": "ST"
        }

        for sl in slots:
            slot_id = sl.get("slotId", "MC")
            slot_pos = sl.get("pos", "MC")
            rating_group = pos_group_map.get(slot_id, pos_group_map.get(slot_pos, "MC"))

            best_p = None
            best_val = -1.0

            for uid in candidate_uids:
                if uid in used_uids:
                    continue
                p_det = self.db.get_player_details(uid)
                if not p_det:
                    continue
                pos_list = p_det.get("positions", [])
                matches_pos = any(
                    slot_pos in pos_str or pos_str in slot_pos
                    or (slot_pos == "ST" and "STC" in pos_str)
                    or (slot_pos == "DM" and "DMC" in pos_str)
                    for pos_str in pos_list
                )
                if slot_pos == "GK" and not matches_pos:
                    continue
                score = p_det["positional_ratings"].get(rating_group, 50.0)
                if matches_pos:
                    score += 12.0
                if score > best_val:
                    best_val = score
                    best_p = p_det

            if best_p:
                used_uids.add(best_p["uid"])
                actual_rating = best_p["positional_ratings"].get(rating_group, best_p["best_rating"])
                entry = {
                    "slotId": slot_id,
                    "pos": slot_pos,
                    "uid": best_p["uid"],
                    "name": best_p["name"],
                    "ca": best_p["ca"],
                    "pa": best_p["pa"],
                    "slot_rating": actual_rating
                }
                assigned_slots.append(entry)
                if actual_rating < weakest_score:
                    weakest_score = actual_rating
                    weakest_slot = entry

        # Find 3 global transfer targets for the weakest slot
        transfer_targets = []
        if weakest_slot:
            w_pos = weakest_slot["pos"]
            cursor.execute("""
                SELECT uid, name, age, club_name, ca, pa, best_rating, dev_tier
                FROM players
                WHERE positions LIKE ? AND club_name NOT LIKE ? AND ca >= ?
                ORDER BY best_rating DESC, pa DESC
                LIMIT 3
            """, (f"%{w_pos}%", f"%{club_name.strip()}%" if club_name else "NONE", max(130, weakest_slot["ca"] + 3)))
            transfer_targets = [dict(r) for r in cursor.fetchall()]

        return {
            "club_name": club_name,
            "lineup": assigned_slots,
            "weakest_link": weakest_slot,
            "transfer_targets": transfer_targets
        }

    # ==================== BASELINE PROGRESS & DEVELOPMENT TRACKER ====================
    def _career_key(self, save_path: str) -> str:
        base = os.path.basename(save_path).lower()
        for token in (" (v02)", " (v03)", " (v04)", ".fm"):
            base = base.replace(token, "")
        return base.strip()

    def reset_baseline_for_active_save(self) -> Dict[str, Any]:
        """Captures current loaded save state as the new T0 baseline for +1/+2 attribute tracking."""
        if not self.is_loaded:
            return {"status": "error", "message": "Önce bir kayıt yükleyin"}
        ckey = self.active_save_info.get("career_key", "default")
        baseline_players = {}
        for uid, p in self.db.player_details_cache.items():
            baseline_players[str(uid)] = {
                "ca": p["ca"],
                "attrs": p["attributes"],
                "date": self.active_save_info.get("game_date", "Başlangıç")
            }
        self.snapshots[ckey] = {
            "baseline_date": self.active_save_info.get("game_date", "Başlangıç"),
            "players": baseline_players
        }
        self._save_json_file(SNAPSHOTS_FILE, self.snapshots)
        for uid, p in self.db.player_details_cache.items():
            p["ca_delta"] = 0
            p["attr_deltas"] = {k: 0 for k in p["attributes"]}
        return {"status": "ok", "baseline_date": self.snapshots[ckey]["baseline_date"], "tracked_players": len(baseline_players)}

    def list_local_saves(self) -> List[Dict[str, Any]]:
        saves: List[Dict[str, Any]] = []
        seen_paths = set()

        for folder in get_candidate_save_dirs():
            if not os.path.exists(folder):
                continue
            for root, _, files in os.walk(folder):
                for f in files:
                    if f.lower().endswith(".fm"):
                        full_path = os.path.join(root, f)
                        norm_path = os.path.normcase(os.path.abspath(full_path))
                        if norm_path in seen_paths:
                            continue
                        try:
                            stat = os.stat(full_path)
                            size_mb = round(stat.st_size / (1024 * 1024), 2)
                            mtime = stat.st_mtime
                            lower_full = full_path.lower()
                            is_official_docs = "sports interactive" in lower_full
                            is_fm27 = "27" in lower_full or "2027" in lower_full
                            is_fm26 = "26" in lower_full or "2026" in lower_full
                            is_backup = "backup" in f.lower()
                            if is_fm27:
                                game_guess = "FM 27"
                            elif is_fm26:
                                game_guess = "FM 26"
                            elif "2024" in lower_full or "24" in lower_full:
                                game_guess = "FM 24"
                            else:
                                game_guess = "FM 26/27"
                            source_label = "Sports Interactive" if is_official_docs else "Arşiv"
                            saves.append({
                                "id": len(saves),
                                "filename": f,
                                "size_mb": size_mb,
                                "modified_timestamp": mtime,
                                "version_guess": f"{game_guess} • {source_label}",
                                "is_official_docs": is_official_docs,
                                "is_fm27": is_fm27,
                                "is_modern": is_fm27 or is_fm26,
                                "is_backup": is_backup,
                                "_internal_path": full_path
                            })
                            seen_paths.add(norm_path)
                        except OSError as exc:
                            sys.stderr.write(f"[Scout Stat Warning] {exc}\n")
                            continue

        saves.sort(key=lambda s: (s["is_official_docs"], s["is_fm27"], s["is_modern"], not s["is_backup"], s["modified_timestamp"]), reverse=True)
        for idx, s in enumerate(saves):
            s["id"] = idx
        return saves

    def resolve_save_path(self, save_ref: str) -> str:
        saves = self.list_local_saves()
        if save_ref.isdigit():
            idx = int(save_ref)
            if 0 <= idx < len(saves):
                return saves[idx]["_internal_path"]
        for s in saves:
            if s["filename"] == save_ref or s["_internal_path"] == save_ref:
                return s["_internal_path"]
        if os.path.exists(save_ref):
            return save_ref
        raise FileNotFoundError(f"Kayıt dosyası bulunamadı: {save_ref}")

    def load_save(self, save_ref: str) -> Dict[str, Any]:
        save_path = self.resolve_save_path(save_ref)
        if not FMSAVE_AVAILABLE:
            raise RuntimeError("fmsave kütüphanesi kurulu değil!")

        self.db.clear()
        self.loaded_save_path = save_path
        self.loaded_save_mtime = os.path.getmtime(save_path) if os.path.exists(save_path) else 0.0

        career_key = self._career_key(save_path)
        existing_baseline = self.snapshots.get(career_key)
        new_baseline_players: Dict[str, Any] = {}

        with fmsave.open(save_path, strict=False) as save:
            info = save.info
            game_date_str = str(getattr(info, "game_date", "2026-07-01"))
            self.active_save_info = {
                "file_name": os.path.basename(save_path),
                "game": getattr(info, "game", "Football Manager 26/27"),
                "build": getattr(info, "build", "Unknown"),
                "game_date": game_date_str,
                "career_key": career_key,
                "baseline_date": existing_baseline["baseline_date"] if existing_baseline else game_date_str,
                "loaded_at": datetime.datetime.now().strftime("%H:%M:%S")
            }

            all_players = save.players()
            total_extracted = len(all_players)

            # Build status lookup dictionaries from global save injury & suspension tables
            injured_uids = set()
            if hasattr(save, "injuries") and callable(save.injuries):
                try:
                    for inj in save.injuries():
                        inj_uid = getattr(inj, "player_uid", 0)
                        if inj_uid and str(getattr(inj, "kind", "history")).lower() == "current":
                            injured_uids.add(inj_uid)
                except Exception as exc:
                    sys.stderr.write(f"[Scout Injury Load Warning] {exc}\n")

            suspended_uids = set()
            if hasattr(save, "suspensions") and callable(save.suspensions):
                try:
                    for s in save.suspensions():
                        s_uid = getattr(s, "player_uid", 0)
                        if s_uid:
                            suspended_uids.add(s_uid)
                except Exception as exc:
                    sys.stderr.write(f"[Scout Suspension Load Warning] {exc}\n")

            records: List[Dict[str, Any]] = []
            for p in all_players:
                uid = p.uid
                uid_str = str(uid)
                name = p.name or "Bilinmeyen Oyuncu"
                age = p.age or 0
                ca = p.ability.current if p.ability else 0
                pa = p.ability.potential if p.ability else 0
                potential_gap = max(0, pa - ca)

                club_name = getattr(p, "club_name", "") or "Serbest (Kulüpsüz)"
                loan_parent = getattr(p, "loan_parent_club_name", "") or ""
                on_loan = getattr(p, "on_loan", False)
                is_on_loan = 1 if on_loan else 0

                contract_obj = getattr(p, "contract", None)
                c_club = (getattr(contract_obj, "club_name", "") or "") if contract_obj else ""
                contract_club = loan_parent if (on_loan and loan_parent) else (c_club if c_club else club_name)

                nation_name = getattr(p, "nation_name", "") or ""
                height_cm = getattr(p, "height_cm", 0) or 0
                left_foot = getattr(p, "left_foot", 10) or 10
                right_foot = getattr(p, "right_foot", 10) or 10
                transfer_val = getattr(p, "transfer_value", 0) or 0

                wage = getattr(contract_obj, "wage", 0) if contract_obj else 0
                wage = wage or 0
                contract_end = getattr(contract_obj, "end", None) if contract_obj else None
                contract_end_year = contract_end.year if contract_end and hasattr(contract_end, "year") else 0
                contract_end_str = str(contract_end) if contract_end else "-"

                # ==================== PLAYER STATUS / COLOR CODE ====================
                # Priority order: Injured(1) > Suspended(2) > Low Condition(3) > Loaned Out(4) > Expiring Contract(5) > Normal(0)
                raw_condition = getattr(p, "raw_condition", 10000) or 10000
                tvs_state = str(getattr(p, "transfer_value_state", "ok") or "ok")

                if uid in injured_uids:
                    status_code = 1
                    status_label = "Sakat"
                elif uid in suspended_uids:
                    status_code = 2
                    status_label = "Cezalı"
                elif raw_condition < 7300:
                    status_code = 3
                    status_label = "Kondisyon %"
                elif is_on_loan:
                    status_code = 4
                    status_label = "Kirada"
                elif tvs_state == "placeholder":
                    status_code = 5
                    status_label = "Sözleşme Bitiyor"
                elif club_name.startswith("Serbest"):
                    status_code = 6
                    status_label = "Serbest"
                else:
                    status_code = 0
                    status_label = ""

                nat_pos = list(p.natural_positions) if hasattr(p, "natural_positions") else []
                acc_pos = list(p.accomplished_positions) if hasattr(p, "accomplished_positions") else []
                all_pos = list(dict.fromkeys(nat_pos + acc_pos))

                attrs = p.attributes
                consistency = getattr(attrs, "consistency", 10) if attrs else 10
                important_matches = getattr(attrs, "important_matches", 10) if attrs else 10
                injury_proneness = getattr(attrs, "injury_proneness", 10) if attrs else 10
                dirtiness = getattr(attrs, "dirtiness", 10) if attrs else 10
                versatility = getattr(attrs, "versatility", 10) if attrs else 10

                pers = p.personality
                ambition = pers.ambition if pers else 10
                loyalty = pers.loyalty if pers else 10
                pressure = pers.pressure if pers else 10
                professionalism = pers.professionalism if pers else 10
                sportsmanship = pers.sportsmanship if pers else 10
                temperament = pers.temperament if pers else 10
                controversy = pers.controversy if pers else 10
                adaptability = pers.adaptability if pers else 10

                attr_dict: Dict[str, int] = {}
                if attrs:
                    for k in (
                        "finishing", "dribbling", "first_touch", "passing", "technique",
                        "crossing", "long_shots", "heading", "tackling", "marking",
                        "decisions", "composure", "vision", "anticipation", "positioning",
                        "off_the_ball", "work_rate", "teamwork", "determination", "bravery",
                        "concentration", "flair", "leadership", "aggression",
                        "pace", "acceleration", "stamina", "strength", "agility",
                        "balance", "jumping_reach", "natural_fitness",
                        "reflexes", "handling", "one_on_ones", "aerial_reach", "command_of_area"
                    ):
                        val = getattr(attrs, k, None)
                        if val is not None:
                            attr_dict[k] = val

                determination_val = attr_dict.get("determination", 12)
                pos_ratings, best_pos, best_rating, pot_rating = compute_positional_ratings(
                    attr_dict, ca, pa, consistency, important_matches
                )
                dev_score, dev_tier = compute_development_index(
                    age, ca, pa, professionalism, ambition, determination_val, injury_proneness
                )
                is_gk = "GK" in all_pos
                octagon = compute_octagon_scores(attr_dict, is_gk)

                # Baseline progress deltas (+1, +2...)
                ca_delta = 0
                attr_deltas: Dict[str, int] = {}
                if existing_baseline and uid_str in existing_baseline.get("players", {}):
                    base_p = existing_baseline["players"][uid_str]
                    ca_delta = ca - base_p.get("ca", ca)
                    base_attrs = base_p.get("attrs", {})
                    for ak, aval in attr_dict.items():
                        attr_deltas[ak] = aval - base_attrs.get(ak, aval)
                else:
                    for ak in attr_dict:
                        attr_deltas[ak] = 0
                    if len(new_baseline_players) < 15000 and ca >= 95:
                        new_baseline_players[uid_str] = {"ca": ca, "attrs": attr_dict}

                # 5-stage development projection
                base_ca_point = ca - ca_delta
                step1 = min(pa, round(ca + (pa - ca) * (dev_score / 220.0)))
                step2 = min(pa, round(step1 + (pa - step1) * (dev_score / 180.0)))
                dev_curve = [
                    {"label": "Başlangıç (T0)", "ca": base_ca_point, "delta": 0},
                    {"label": "Mevcut", "ca": ca, "delta": ca_delta},
                    {"label": "+1 Sezon", "ca": step1, "delta": step1 - base_ca_point},
                    {"label": "+2 Sezon", "ca": step2, "delta": step2 - base_ca_point},
                    {"label": "Zirve (PA)", "ca": pa, "delta": pa - base_ca_point}
                ]

                self.db.player_details_cache[uid] = {
                    "uid": uid,
                    "name": name,
                    "age": age,
                    "ca": ca,
                    "pa": pa,
                    "potential_gap": potential_gap,
                    "ca_delta": ca_delta,
                    "best_rating": best_rating,
                    "pot_rating": pot_rating,
                    "best_pos": best_pos,
                    "positional_ratings": pos_ratings,
                    "dev_score": dev_score,
                    "dev_tier": dev_tier,
                    "octagon": octagon,
                    "dev_curve": dev_curve,
                    "attr_deltas": attr_deltas,
                    "in_shortlist": uid_str in self.shortlist,
                    "shortlist_note": self.shortlist.get(uid_str, {}).get("note", ""),
                    "club_name": club_name,
                    "loan_parent_club_name": loan_parent,
                    "contract_club_name": contract_club,
                    "is_on_loan": is_on_loan,
                    "status_code": status_code,
                    "status_label": status_label,
                    "raw_condition": raw_condition,
                    "nation_name": nation_name,
                    "positions": all_pos,
                    "natural_positions": nat_pos,
                    "left_foot": left_foot,
                    "right_foot": right_foot,
                    "height_cm": height_cm,
                    "transfer_value": transfer_val,
                    "wage": wage,
                    "contract_end_year": contract_end_year,
                    "contract_end_str": contract_end_str,
                    "hidden": {
                        "consistency": consistency,
                        "important_matches": important_matches,
                        "injury_proneness": injury_proneness,
                        "dirtiness": dirtiness,
                        "versatility": versatility
                    },
                    "personality": {
                        "ambition": ambition,
                        "loyalty": loyalty,
                        "pressure": pressure,
                        "professionalism": professionalism,
                        "sportsmanship": sportsmanship,
                        "temperament": temperament,
                        "controversy": controversy,
                        "adaptability": adaptability
                    },
                    "attributes": attr_dict
                }

                records.append({
                    "uid": uid,
                    "name": name,
                    "age": age,
                    "ca": ca,
                    "pa": pa,
                    "potential_gap": potential_gap,
                    "ca_delta": ca_delta,
                    "best_rating": best_rating,
                    "pot_rating": pot_rating,
                    "best_pos": best_pos,
                    "dev_score": dev_score,
                    "dev_tier": dev_tier,
                    "club_name": club_name,
                    "loan_parent_club_name": loan_parent,
                    "contract_club_name": contract_club,
                    "is_on_loan": is_on_loan,
                    "nation_name": nation_name,
                    "positions": ",".join(all_pos),
                    "natural_positions": ",".join(nat_pos),
                    "left_foot": left_foot,
                    "right_foot": right_foot,
                    "height_cm": height_cm,
                    "transfer_value": transfer_val,
                    "wage": wage,
                    "contract_end_year": contract_end_year,
                    "contract_end_str": contract_end_str,
                    "status_code": status_code,
                    "status_label": status_label,
                    "consistency": consistency,
                    "important_matches": important_matches,
                    "injury_proneness": injury_proneness,
                    "dirtiness": dirtiness,
                    "versatility": versatility,
                    "ambition": ambition,
                    "loyalty": loyalty,
                    "pressure": pressure,
                    "professionalism": professionalism,
                    "sportsmanship": sportsmanship,
                    "temperament": temperament,
                    "controversy": controversy,
                    "adaptability": adaptability
                })

            self.db.insert_players_batch(records)
            self.is_loaded = True
            self.active_save_info["total_players"] = total_extracted

            if not existing_baseline and new_baseline_players:
                self.snapshots[career_key] = {
                    "baseline_date": game_date_str,
                    "players": new_baseline_players
                }
                self._save_json_file(SNAPSHOTS_FILE, self.snapshots)

            return {
                "status": "success",
                "save_info": self.active_save_info,
                "total_players": total_extracted
            }


scout_engine = UniversalScoutEngine()
