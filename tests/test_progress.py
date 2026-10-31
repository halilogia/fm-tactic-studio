import contextlib
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace as NS
from unittest.mock import patch
import unittest

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
import scout_engine as se
from fmf_parser import parse_fmf_file

class ProgressTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'test.fm'
        self.path.touch()
        self.snap = Path(self.temp.name) / 'snap.json'
        self.sp = patch.object(se, 'SNAPSHOTS_FILE', str(self.snap))
        self.sp.start()
        self.addCleanup(self.sp.stop)
        self.engine = se.UniversalScoutEngine()
        self.addCleanup(self.engine.db.conn.close)
        self.engine.resolve_save_path = lambda _: str(self.path)
        self.player = NS(uid=1, name='Academy Keeper', age=17,
            ability=NS(current=70, potential=140), club_name='Test',
            natural_positions=('GK',), accomplished_positions=(),
            attributes=NS(determination=15), personality=None, positions=NS(gk=20))

    def load(self, date, ca=70):
        self.player.ability.current = ca
        save = NS(info=NS(game_date=dt.date.fromisoformat(date)), players=lambda: [self.player])
        with patch.object(se, 'FMSAVE_AVAILABLE', True), patch.object(se.fmsave, 'open', return_value=contextlib.nullcontext(save)):
            self.engine.load_save(str(self.path))
        return self.engine.db.player_details_cache[self.player.uid]

    def test_first_observation_is_not_backdated_and_low_ca_is_tracked(self):
        p = self.load('2026-07-18')
        self.assertEqual(p['ca_history'], [{'date': '2026-07-18', 'ca': 70}])
        self.assertEqual(p['best_pos'], 'GK')
        self.assertIn('1', next(iter(json.loads(self.snap.read_text()).values()))['players'])
        self.assertEqual(self.engine.active_save_info['career_start_date'], None)

    def test_same_day_replacement_and_rollback(self):
        self.load('2026-07-18')
        self.load('2026-07-19', 71)
        p = self.load('2026-07-19', 72)
        self.assertEqual([x['ca'] for x in p['ca_history']], [70, 72])
        p = self.load('2026-07-18', 69)
        self.assertEqual(p['ca_history'], [{'date': '2026-07-18', 'ca': 69}])
        self.assertEqual(p['ca_delta'], 0)
        self.assertEqual(p['baseline_ca'], 69)
        p = self.load('2026-06-01', 65)
        self.assertEqual(p['baseline_ca'], 65)
        self.assertEqual(p['ca_history'], [{'date': '2026-06-01', 'ca': 65}])

    def test_new_player_added_to_existing_career_and_reset(self):
        self.load('2026-07-18')
        self.player.uid = 2
        self.load('2026-07-19')
        self.assertIn('2', next(iter(self.engine.snapshots.values()))['players'])
        self.player.uid = 1
        self.load('2026-07-20', 74)
        self.engine.reset_baseline_for_active_save()
        p = self.engine.db.player_details_cache[1]
        self.assertEqual(p['ca_delta'], 0)
        self.assertEqual(p['baseline_ca'], 74)
        self.assertEqual(len(p['dev_curve']), 1)
        self.assertEqual(self.engine.db.query_players()['players'][0]['ca_delta'], 0)

    def test_old_baseline_date_is_preserved(self):
        self.load('2026-06-29')
        self.load('2026-07-18', 74)
        p = self.engine.db.player_details_cache[1]
        self.assertEqual(p['ca_history'][0]['date'], '2026-06-29')

    def test_archive_does_not_invent_tactics(self):
        f = Path(self.temp.name) / 'test.fmf'
        f.write_bytes(b'\x02\x01afe.' + b'x' * 64)
        p = parse_fmf_file(f)
        for field in ('detected_formation', 'detected_mentality', 'detected_instructions'):
            self.assertIsNone(p[field])
        self.assertFalse(p['instructions_available'])

if __name__ == '__main__':
    unittest.main(verbosity=2)
