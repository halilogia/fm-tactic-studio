"""User-relative FM locations, including redirected Windows Documents."""
import os
from pathlib import Path


def documents_dirs():
    paths = []
    if os.name == 'nt':
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                    r'Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders') as key:
                paths.append(Path(os.path.expandvars(winreg.QueryValueEx(key, 'Personal')[0])))
        except OSError:
            pass
    paths.append(Path.home() / 'Documents')
    for name in ('OneDrive', 'OneDriveConsumer', 'OneDriveCommercial'):
        if os.environ.get(name):
            paths.append(Path(os.environ[name]) / 'Documents')
    return list(dict.fromkeys(paths))


def local_app_data():
    return Path(os.environ.get('LOCALAPPDATA') or Path.home() / 'AppData/Local')


def standard_save_dirs():
    paths = []
    for version in ('27', '2027', '26', '2026', '24', '2024'):
        for base in [*documents_dirs(), local_app_data()]:
            for sub in ('games', 'cloud', 'Temporary'):
                path = base / 'Sports Interactive' / f'Football Manager {version}' / sub
                if path.is_dir():
                    paths.append(str(path))
    return list(dict.fromkeys(paths))
