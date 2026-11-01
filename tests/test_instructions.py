from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app
import scout_engine as se

class InstructionTests(unittest.TestCase):
    def test_manual_instructions_round_trip_without_changing_fmf(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fmf = root / 'test.fmf'
            original = b'\x02\x01afe.' + bytes(40)
            fmf.write_bytes(original)
            instructions = {'in_possession': 'Kısa pas', 'transition': 'Karşı pres'}
            with patch.object(app, 'NOTES_FILE', str(root / 'notes.json')):
                app.save_details({'file_name': 'test.fmf', 'instructions': instructions})
                result = app.get_tactics(str(root))['tactics'][0]
            self.assertEqual(result['saved_instructions'], instructions)
            self.assertIsNone(result['detected_instructions'])
            self.assertEqual(fmf.read_bytes(), original)

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
