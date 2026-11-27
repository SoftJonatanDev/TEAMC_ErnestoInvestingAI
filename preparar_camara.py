#!/usr/bin/env python3
"""Install pinned MediaPipe assets locally. Optional; requires Internet once.

Only Python's standard library is used. Downloads are staged and validated before
switching sources.json to local mode. This script never handles camera images.
"""
import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent / 'vendor' / 'mediapipe'
VERSION = '0.10.21'
BASE = f'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@{VERSION}/'
FILES = {
    'vision_bundle.mjs': BASE + 'vision_bundle.mjs',
    'wasm/vision_wasm_internal.js': BASE + 'wasm/vision_wasm_internal.js',
    'wasm/vision_wasm_internal.wasm': BASE + 'wasm/vision_wasm_internal.wasm',
    'wasm/vision_wasm_nosimd_internal.js': BASE + 'wasm/vision_wasm_nosimd_internal.js',
    'wasm/vision_wasm_nosimd_internal.wasm': BASE + 'wasm/vision_wasm_nosimd_internal.wasm',
    'models/hand_landmarker.task': 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    'LICENSE-MediaPipe.txt': 'https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE',
}


def validate(path: Path) -> None:
    data = path.read_bytes()
    if path.suffix == '.wasm' and (len(data) < 100000 or data[:4] != b'\x00asm'):
        raise ValueError(f'WebAssembly invalido: {path.name}')
    if path.suffix in ('.js', '.mjs') and (len(data) < 10000 or b'<html' in data[:300].lower()):
        raise ValueError(f'JavaScript invalido: {path.name}')
    if path.suffix == '.task':
        if not zipfile.is_zipfile(path):
            raise ValueError('El modelo no es un paquete MediaPipe valido.')
        with zipfile.ZipFile(path) as z:
            if not any(n.endswith('.tflite') for n in z.namelist()):
                raise ValueError('El paquete no contiene el modelo esperado.')
    if path.name.startswith('LICENSE') and b'Apache License' not in data:
        raise ValueError('La licencia no coincide con MediaPipe.')


def verify() -> bool:
    try:
        manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        for item in manifest['files']:
            path = ROOT / item['path']
            if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
                return False
        return set(FILES) == {x['path'] for x in manifest['files']}
    except (OSError, ValueError, KeyError):
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true', help='Verificar archivos locales sin Internet.')
    parser.add_argument('--force', action='store_true', help='Descargar otra vez todos los recursos.')
    args = parser.parse_args()
    if args.verify:
        ok = verify()
        print('Recursos locales verificados.' if ok else 'Recursos no instalados o incompletos.')
        return 0 if ok else 1
    ROOT.mkdir(parents=True, exist_ok=True)
    if verify() and not args.force:
        (ROOT/'sources.json').write_text(json.dumps({'mode':'local','version':VERSION,'model_version':'float16/1'}, indent=2))
        print('Los recursos locales ya estan completos.')
        return 0
    print('Instalando seguimiento de manos. Se requiere Internet solo para esta descarga.')
    print('Origen: jsDelivr / MediaPipe (Google). No se necesita cuenta, clave API ni npm.')
    try:
        with tempfile.TemporaryDirectory(prefix='mediapipe-', dir=ROOT.parent) as tmp:
            stage = Path(tmp)
            manifest = []
            for relative, url in FILES.items():
                print('Descargando ' + relative, flush=True)
                target = stage / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                request = urllib.request.Request(url, headers={'User-Agent':'Ernesto-Local-Setup/3.0'})
                with urllib.request.urlopen(request, timeout=90) as source, target.open('wb') as dest:
                    shutil.copyfileobj(source, dest)
                validate(target)
                manifest.append({'path':relative,'url':url,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
            for item in manifest:
                target = ROOT / item['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                os.replace(stage/item['path'], target)
            (ROOT/'manifest.json').write_text(json.dumps({'version':VERSION,'files':manifest}, indent=2), encoding='utf-8')
            # This is committed last: an incomplete download never becomes active.
            config = ROOT/'sources.next.json'
            config.write_text(json.dumps({'mode':'local','version':VERSION,'model_version':'float16/1'}, indent=2), encoding='utf-8')
            os.replace(config, ROOT/'sources.json')
        print('\nListo. Recarga con Ctrl+F5. La camara ya puede funcionar sin Internet.')
        print('La disponibilidad de voces locales depende del sistema operativo.')
        return 0
    except (OSError, urllib.error.URLError, ValueError, zipfile.BadZipFile) as exc:
        print('\nNo se pudo completar la descarga: '+str(exc), file=sys.stderr)
        print('No se ha activado una instalacion incompleta. Revisa tu conexion y repite el comando.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
