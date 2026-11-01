"""Read FM Xbox WGS indexes; reconstruct private cache copies, never edit WGS."""
from io import BytesIO
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import tempfile
import uuid

from .save_paths import local_app_data


def _read(stream, size):
    data = stream.read(size)
    if len(data) != size:
        raise ValueError('Truncated Xbox container')
    return data


def _u32(stream):
    return struct.unpack('<I', _read(stream, 4))[0]


def _string(stream):
    size = _u32(stream)
    if size > 4096:
        raise ValueError('Invalid Xbox string length')
    return _read(stream, size * 2).decode('utf-16-le')


def read_index(path):
    stream = BytesIO(Path(path).read_bytes())
    if _u32(stream) != 14:
        raise ValueError('Unsupported Xbox index version')
    count = _u32(stream)
    if count > 10000:
        raise ValueError('Invalid Xbox container count')
    _read(stream, 4)
    _string(stream)  # package
    _read(stream, 12)
    _string(stream)  # index ID
    _read(stream, 8)
    entries = []
    for _ in range(count):
        name, label, _cloud = _string(stream), _string(stream), _string(stream)
        revision = _read(stream, 1)[0]
        _read(stream, 4)
        guid = uuid.UUID(bytes_le=_read(stream, 16)).hex.upper()
        _read(stream, 24)
        entries.append({'name': name, 'label': label, 'guid': guid, 'revision': revision})
    return entries


def read_chunks(container):
    stream = BytesIO(Path(container).read_bytes())
    if _u32(stream) != 4:
        raise ValueError('Unsupported Xbox blob map')
    count = _u32(stream)
    if count > 10000:
        raise ValueError('Invalid Xbox blob count')
    chunks = {}
    for _ in range(count):
        name = _read(stream, 128).decode('utf-16-le').split('\0', 1)[0]
        first = uuid.UUID(bytes_le=_read(stream, 16)).hex.upper()
        _read(stream, 16)  # cloud GUID; only the local GUID is used
        if name.isdecimal():
            number = int(name)
            if number in chunks:
                raise ValueError('Duplicate Xbox save chunk')
            chunks[number] = Path(container).parent / first
    if not chunks:
        return []  # profiles, tactics and settings are not save games
    if sorted(chunks) != list(range(len(chunks))):
        raise ValueError('Missing Xbox save chunk')
    paths = [chunks[i] for i in range(len(chunks))]
    if not all(p.is_file() for p in paths):
        raise ValueError('Xbox save is not fully downloaded')
    with paths[0].open('rb') as stream:
        if stream.read(6) != b'\x02\x01fmf.':
            raise ValueError('Xbox blob is not an FM save')
    return paths


def signature(entry):
    return [(str(path), path.stat().st_size, path.stat().st_mtime_ns)
            for path in [Path(entry['_wgs_container']), *map(Path, entry['_wgs_chunks'])]]


def list_xbox_saves(packages=None, cache=None):
    packages = Path(packages) if packages is not None else local_app_data() / 'Packages'
    cache = Path(cache) if cache is not None else local_app_data() / 'FM Tactic Studio/xbox-cache'
    result = []
    if not packages.is_dir():
        return result
    for package in packages.glob('SportsInteractive.FootballManager*_*'):
        version = re.search(r'FootballManager(\d+)', package.name)
        game = version.group(1) if version else ''
        for index in (package / 'SystemAppData/wgs').glob('*/containers.index'):
            try:
                entries = read_index(index)
            except (OSError, ValueError, UnicodeError):
                continue
            for item in entries:
                container = index.parent / item['guid'] / f"container.{item['revision']}"
                try:
                    chunks = read_chunks(container)
                    if not chunks:
                        continue
                    # Keep cache files isolated per package/account/container. Names from
                    # the index never become directories or unsanitized file paths.
                    key = hashlib.sha256(str(container.parent).encode()).hexdigest()[:24]
                    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', item['label']).strip('. ') or 'Xbox save'
                    if not filename.lower().endswith('.fm'):
                        filename += '.fm'
                    target = cache / key / filename
                    mtime = max(p.stat().st_mtime for p in [container, *chunks])
                    result.append({
                        'filename': filename, 'size_mb': round(sum(p.stat().st_size for p in chunks) / 1048576, 2),
                        'modified_timestamp': mtime, 'version_guess': f'FM {game} • Xbox Cloud',
                        'is_official_docs': True, 'is_fm27': game in ('27', '2027'),
                        'is_modern': game in ('26', '27', '2026', '2027'),
                        'is_backup': 'backup' in filename.lower(), 'source': 'xbox',
                        '_internal_path': str(target), '_wgs_index': str(index),
                        '_wgs_guid': item['guid'], '_wgs_container': str(container),
                        '_wgs_chunks': [str(p) for p in chunks]
                    })
                except (OSError, ValueError, UnicodeError):
                    continue
    return result


def materialize(entry):
    """Atomically replace a cache copy only after all source blobs remain stable."""
    target = Path(entry['_internal_path'])
    stamp = target.with_suffix('.source.json')
    before = signature(entry)
    expected = json.dumps(before)
    if target.is_file() and stamp.is_file() and stamp.read_text() == expected:
        return str(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=target.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'wb') as output:
            for chunk in entry['_wgs_chunks']:
                with open(chunk, 'rb') as source:
                    shutil.copyfileobj(source, output)
        if signature(entry) != before:
            raise ValueError('Xbox kaydı eşitleniyor; birkaç saniye sonra yeniden deneyin.')
        os.replace(temporary, target)
        os.utime(target, (entry['modified_timestamp'], entry['modified_timestamp']))
        stamp.write_text(expected)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return str(target)
