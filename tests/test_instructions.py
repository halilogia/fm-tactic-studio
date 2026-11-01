from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app
import scout_engine as se

class InstructionTests(unittest.TestCase):
    def test_instructions_come_from_fmf_not_manual_input(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fmf = root / 'test.fmf'
            original = b'\x02\x01afe.' + bytes(40)
            fmf.write_bytes(original)
            with patch.object(app, 'NOTES_FILE', str(root / 'notes.json')):
                app.save_details({'file_name': 'test.fmf', 'notes': 'Deneme notu', 'instructions': {'in_possession': 'Hatalı manuel'}})
                result = app.get_tactics(str(root))['tactics'][0]
            self.assertNotIn('saved_instructions', result)
            self.assertIsNone(result['detected_instructions'])
            self.assertFalse(result['instructions_available'])
            self.assertEqual(result['saved_notes'], 'Deneme notu')
            self.assertEqual(fmf.read_bytes(), original)

    def test_valid_tactic_resolves_team_instructions(self):
        sample = Path(app.get_default_tactics_dir()) / 'a.fmf'
        if sample.exists():
            parsed = app.parse_fmf_file(str(sample))
            self.assertTrue(parsed['instructions_available'])
            self.assertIsNotNone(parsed['detected_instructions'])
            self.assertIn('in_possession', parsed['detected_instructions'])
            self.assertIn('transition', parsed['detected_instructions'])
            self.assertIn('out_of_possession', parsed['detected_instructions'])

    def test_user_name_digits_do_not_change_game_edition(self):
        with tempfile.TemporaryDirectory(prefix='User27-') as directory:
            folder = Path(directory) / 'Sports Interactive/Football Manager 26/games'
            folder.mkdir(parents=True)
            (folder / 'test.fm').write_bytes(b'example')
            eng = se.UniversalScoutEngine()
            self.addCleanup(eng.db.conn.close)
            with patch.object(se, 'get_candidate_save_dirs', return_value=[str(folder)]), patch.object(se, 'list_xbox_saves', return_value=[]):
                found = eng.list_local_saves()
            self.assertFalse(found[0]['is_fm27'])
            self.assertTrue(found[0]['version_guess'].startswith('FM 26'))

if __name__ == '__main__': unittest.main()
