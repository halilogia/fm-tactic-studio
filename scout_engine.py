"""
FM Universal Scout & Tactic Studio — Core Save Ingestion & SQLite Query Engine
Supports FM 26 & FM 27 (.fm) save files via fmsave with sub-millisecond in-memory SQLite filtering.
"""

from __future__ import annotations
import os
import sys
import json
import sqlite3
from typing import List, Dict, Any, Optional

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


def get_candidate_save_dirs() -> List[str]:
    """Returns candidate FM save directories prioritizing official Documents\\Sports Interactive first."""
    dirs: List[str] = []

    env_dir = os.environ.get("FM_SAVES_DIR")
    if env_dir and os.path.exists(env_dir):
        dirs.append(env_dir)

    # 1. Official Documents\Sports Interactive\Football Manager <Version>\games & AppData\Local\Sports Interactive FIRST
    user_home = os.path.expanduser("~")
    for ver in ("27", "2027", "26", "2026", "2024", "24"):
        for sub in ("games", "cloud", "Temporary"):
            cand_doc = os.path.join(user_home, "Documents", "Sports Interactive", f"Football Manager {ver}", sub)
            if os.path.exists(cand_doc):
                dirs.append(cand_doc)
            cand_appdata = os.path.join(user_home, "AppData", "Local", "Sports Interactive", f"Football Manager {ver}", sub)
            if os.path.exists(cand_appdata):
                dirs.append(cand_appdata)

    # 2. Local config (explicit saves_dir or archive fallback from tactics_dir)
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
                # Secondary archive fallback if user also keeps older saves next to tactics_dir
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
                club_name TEXT,
                nation_name TEXT,
                positions TEXT,
                natural_positions TEXT,
                left_foot INTEGER,
                right_foot INTEGER,
                height_cm INTEGER,
                transfer_value INTEGER,
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_age ON players(age)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_name ON players(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_club ON players(club_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_consistency ON players(consistency)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_injury ON players(injury_proneness)")
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
                uid, name, age, ca, pa, potential_gap, club_name, nation_name,
                positions, natural_positions, left_foot, right_foot,
                height_cm, transfer_value, consistency, important_matches,
                injury_proneness, dirtiness, versatility, ambition,
                loyalty, pressure, professionalism, sportsmanship,
                temperament, controversy, adaptability
            ) VALUES (
                :uid, :name, :age, :ca, :pa, :potential_gap, :club_name, :nation_name,
                :positions, :natural_positions, :left_foot, :right_foot,
                :height_cm, :transfer_value, :consistency, :important_matches,
                :injury_proneness, :dirtiness, :versatility, :ambition,
                :loyalty, :pressure, :professionalism, :sportsmanship,
                :temperament, :controversy, :adaptability
            )
        """
        cursor.executemany(insert_sql, player_records)
        self.conn.commit()

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
    ) -> Dict[str, Any]:
        where_clauses = [
            "ca >= ?", "ca <= ?",
            "pa >= ?", "pa <= ?",
            "age >= ?", "age <= ?",
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
            min_consistency,
            max_injury_proneness,
            min_important_matches,
            min_versatility,
            min_ambition,
            min_professionalism,
            min_pressure
        ]

        if wonderkids_only:
            where_clauses.append("age <= 21 AND pa >= 150")

        if query.strip():
            where_clauses.append("(name LIKE ? OR club_name LIKE ? OR nation_name LIKE ?)")
            q_like = f"%{query.strip()}%"
            params.extend([q_like, q_like, q_like])

        if name_filter.strip():
            where_clauses.append("name LIKE ?")
            params.append(f"%{name_filter.strip()}%")

        if club_filter.strip():
            where_clauses.append("club_name LIKE ?")
            params.append(f"%{club_filter.strip()}%")

        if nation_filter.strip():
            where_clauses.append("nation_name LIKE ?")
            params.append(f"%{nation_filter.strip()}%")

        if position.strip():
            where_clauses.append("positions LIKE ?")
            params.append(f"%{position.strip().upper()}%")

        where_sql = " AND ".join(where_clauses)

        allowed_sorts = {
            "pa": "pa", "ca": "ca", "potential_gap": "potential_gap",
            "age": "age", "name": "name", "club_name": "club_name",
            "nation_name": "nation_name", "consistency": "consistency",
            "important_matches": "important_matches", "injury_proneness": "injury_proneness",
            "versatility": "versatility", "dirtiness": "dirtiness",
            "ambition": "ambition", "professionalism": "professionalism",
            "pressure": "pressure", "loyalty": "loyalty",
            "transfer_value": "transfer_value"
        }
        safe_sort = allowed_sorts.get(sort_by.lower(), "pa")
        safe_order = "ASC" if sort_order.lower() == "asc" else "DESC"

        cursor = self.conn.cursor()
        count_sql = f"SELECT COUNT(*) FROM players WHERE {where_sql}"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()[0]

        select_sql = f"""
            SELECT uid, name, age, ca, pa, potential_gap, club_name, nation_name,
                   positions, natural_positions, left_foot, right_foot,
                   height_cm, transfer_value, consistency, important_matches,
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
    """Orchestrates FM 26 & FM 27 save game discovery, loading, and querying."""

    def __init__(self) -> None:
        self.db = ScoutDatabase()
        self.active_save_info: Dict[str, Any] = {}
        self.is_loaded: bool = False

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
        """Resolves either a save index/filename from discovered saves or an explicit path."""
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

        with fmsave.open(save_path, strict=False) as save:
            info = save.info
            self.active_save_info = {
                "file_name": os.path.basename(save_path),
                "game": getattr(info, "game", "Football Manager 26/27"),
                "build": getattr(info, "build", "Unknown"),
                "game_date": str(getattr(info, "game_date", "Bilinmiyor"))
            }

            all_players = save.players()
            total_extracted = len(all_players)

            records: List[Dict[str, Any]] = []
            for p in all_players:
                uid = p.uid
                name = p.name or "Bilinmeyen Oyuncu"
                age = p.age or 0
                ca = p.ability.current if p.ability else 0
                pa = p.ability.potential if p.ability else 0
                potential_gap = max(0, pa - ca)
                club_name = p.club_name or "Serbest (Kulüpsüz)"
                nation_name = getattr(p, "nation_name", "") or ""
                height_cm = getattr(p, "height_cm", 0) or 0
                left_foot = getattr(p, "left_foot", 10) or 10
                right_foot = getattr(p, "right_foot", 10) or 10
                transfer_val = getattr(p, "transfer_value", 0) or 0

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

                self.db.player_details_cache[uid] = {
                    "uid": uid,
                    "name": name,
                    "age": age,
                    "ca": ca,
                    "pa": pa,
                    "potential_gap": potential_gap,
                    "club_name": club_name,
                    "nation_name": nation_name,
                    "positions": all_pos,
                    "natural_positions": nat_pos,
                    "left_foot": left_foot,
                    "right_foot": right_foot,
                    "height_cm": height_cm,
                    "transfer_value": transfer_val,
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
                    "club_name": club_name,
                    "nation_name": nation_name,
                    "positions": ",".join(all_pos),
                    "natural_positions": ",".join(nat_pos),
                    "left_foot": left_foot,
                    "right_foot": right_foot,
                    "height_cm": height_cm,
                    "transfer_value": transfer_val,
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

            return {
                "status": "success",
                "save_info": self.active_save_info,
                "total_players": total_extracted
            }


scout_engine = UniversalScoutEngine()
