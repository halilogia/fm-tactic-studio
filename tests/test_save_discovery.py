from pathlib import Path
import json
import os
import struct
import sys
import tempfile
import unittest
from unittest.mock import patch
import uuid

sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from core.save_paths import standard_save_dirs
from core.xbox_saves import read_index, read_chunks, list_xbox_saves, materialize, signature

def string(value):
    return struct.pack('<I',len(value))+value.encode('utf-16-le')

class XboxSaveTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name)
        self.packages=self.base/'Packages'
        self.account=self.packages/'SportsInteractive.FootballManager27_test/SystemAppData/wgs/account'
        self.account.mkdir(parents=True)
        self.guid=uuid.uuid4()
        self.folder=self.account/self.guid.hex.upper()
        self.folder.mkdir()
        self.index=self.account/'containers.index'
        self.index.write_bytes(struct.pack('<III',14,1,0)+string('package')+bytes(12)+string('id')+bytes(8)
            +string('123')+string('Test career')+string('revision')+bytes([1])+struct.pack('<I',1)
            +self.guid.bytes_le+bytes(24))
        self.write_chunks([('1',b'second'),('0',b'\x02\x01fmf.first')])

    def write_chunks(self, items):
        data=struct.pack('<II',4,len(items))
        for name,value in items:
            guid=uuid.uuid4()
            (self.folder/guid.hex.upper()).write_bytes(value)
            data+=name.encode('utf-16-le').ljust(128,b'\0')+guid.bytes_le+guid.bytes_le
        (self.folder/'container.1').write_bytes(data)

    def test_indexed_names_and_ordered_chunks(self):
        self.assertEqual(read_index(self.index)[0]['label'],'Test career')
        entries=list_xbox_saves(self.packages,self.base/'cache')
        self.assertEqual(len(entries),1)
        entry=entries[0]
        before=signature(entry)
        p=Path(materialize(entry))
        self.assertEqual(p.read_bytes(),b'\x02\x01fmf.firstsecond')
        self.assertEqual(signature(entry),before)
        self.assertEqual(entry['filename'],'Test career.fm')
        stamp=p.stat().st_mtime_ns
        self.assertEqual(materialize(entry),str(p))
        self.assertEqual(p.stat().st_mtime_ns,stamp)

    def test_missing_chunks_are_rejected(self):
        self.write_chunks([('0',b'\x02\x01fmf.a'),('2',b'gap')])
        with self.assertRaises(ValueError): read_chunks(self.folder/'container.1')
        self.assertEqual(list_xbox_saves(self.packages,self.base/'cache'),[])

    def test_bad_versions_and_non_save_blobs_are_rejected(self):
        self.index.write_bytes(struct.pack('<III',99,1,0))
        with self.assertRaises(ValueError): read_index(self.index)
        self.write_chunks([('0',b'not a save')])
        with self.assertRaises(ValueError): read_chunks(self.folder/'container.1')

    def test_cache_is_not_replaced_when_source_changes_during_copy(self):
        entry=list_xbox_saves(self.packages,self.base/'cache')[0]
        p=Path(materialize(entry))
        old=p.read_bytes()
        p.with_suffix('.source.json').unlink()
        real=signature(entry)
        with patch('core.xbox_saves.signature',side_effect=[real,real+['changed']]):
            with self.assertRaises(ValueError): materialize(entry)
        self.assertEqual(p.read_bytes(),old)
        self.assertEqual(list(p.parent.glob('*.tmp')),[])

    def test_documents_and_localappdata_follow_current_user(self):
        docs=self.base/'Different User/Redirected Documents'
        local=self.base/'Different User/AppData/Local'
        for version in ('26','27'):
            (docs/f'Sports Interactive/Football Manager {version}/games').mkdir(parents=True)
        (local/'Sports Interactive/Football Manager 27/Temporary').mkdir(parents=True)
        with patch('core.save_paths.documents_dirs',return_value=[docs]), patch.dict(os.environ,{'LOCALAPPDATA':str(local)}):
            found=standard_save_dirs()
        self.assertIn(str(docs/'Sports Interactive/Football Manager 26/games'),found)
        self.assertIn(str(docs/'Sports Interactive/Football Manager 27/games'),found)
        self.assertIn(str(local/'Sports Interactive/Football Manager 27/Temporary'),found)

if __name__=='__main__': unittest.main(verbosity=2)
