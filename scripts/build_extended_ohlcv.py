#!/usr/bin/env python3
"""Extend candle coverage without changing any original close or any 120-day candle.

No downloads. Earlier O/H/L/V fields are deterministic synthetic reconstructions,
not observations. The original 13 datasets are read-only inputs.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/14_ohlcv_sintetico_504d.json'


def read(name: str):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8'))


def build() -> dict:
    history = read('02_precios_sinteticos_504d.json')
    original = read('03_ohlcv_sintetico_120d.json')
    dates = history['fechas']
    offset = len(dates) - len(original['fechas'])
    if original['fechas'] != dates[offset:]:
        raise ValueError('Original OHLCV dates are not the suffix of the canonical history.')
    series = {}
    for ticker, closes in history['cierres'].items():
        old = original['series'][ticker]
        if closes[offset:] != old['c']:
            raise ValueError(f'{ticker}: original OHLCV close mismatch.')
        seed = int.from_bytes(hashlib.sha256(('EIA-OHLCV-504-v1:' + ticker).encode()).digest()[:8], 'big')
        rng = random.Random(seed)
        # Preserve the observed scale of the supplied synthetic volume/wicks.
        wick_scale = statistics.median((h - l) / c for h, l, c in zip(old['h'], old['l'], old['c']))
        gap_scale = statistics.median(abs(old['o'][j] / closes[offset+j-1] - 1) for j in range(1,len(old['o'])))
        base_volume = statistics.median(old['v'])
        new = {k: [] for k in ('o', 'h', 'l', 'c', 'v')}
        for i in range(offset):
            close = closes[i]
            previous = closes[i-1] if i else close
            # A bounded overnight gap; the very first open has no earlier reference.
            gap = max(-0.025, min(0.025, rng.gauss(0, max(gap_scale, 0.0015))))
            opening = round(max(0.01, previous * (1 + gap)), 2) if i else close
            wick = max(0.001, min(0.025, wick_scale * (0.2 + rng.random() * 0.35)))
            high = round(max(opening, close) * (1 + wick * (0.5 + rng.random())), 2)
            low = round(max(0.01, min(opening, close) * (1 - wick * (0.5 + rng.random()))), 2)
            movement = abs(close / previous - 1)
            volume = int(round(base_volume * (0.65 + rng.random() * 0.7) * (1 + min(1.5, movement * 12))))
            for key, value in zip(('o', 'h', 'l', 'c', 'v'), (opening, high, low, close, volume)):
                new[key].append(value)
        for key in new:
            new[key].extend(old[key])  # Exact original values, including the boundary candle.
        series[ticker] = new
    return {
        'fechas': dates,
        'series': series,
        'metadatos': {
            'version': 1,
            'naturaleza': 'Sintetica; no contiene nuevas observaciones de mercado.',
            'fuente_cierres': '02_precios_sinteticos_504d.json',
            'fuente_ultimas_120_velas': '03_ohlcv_sintetico_120d.json',
            'sesiones_totales': len(dates),
            'sesiones_ohlcv_reconstruidas': offset,
            'sesiones_ohlcv_originales': len(original['fechas']),
            'fin_reconstruccion': dates[offset-1],
            'inicio_ohlcv_original': dates[offset],
            'metodo': 'Apertura, extremos y volumen anteriores reconstruidos de forma determinista; cierres copiados sin cambio. No se extrapolan fechas futuras.',
            'generador': 'scripts/build_extended_ohlcv.py; semilla SHA256 por ticker, version EIA-OHLCV-504-v1'
        }
    }


def validate(data: dict) -> None:
    history = read('02_precios_sinteticos_504d.json')
    original = read('03_ohlcv_sintetico_120d.json')
    assert data['fechas'] == history['fechas']
    assert data['fechas'] == sorted(set(data['fechas']))
    for ticker, s in data['series'].items():
        assert s['c'] == history['cierres'][ticker], ticker
        for key in ('o', 'h', 'l', 'c', 'v'):
            assert len(s[key]) == len(data['fechas']), (ticker, key)
            assert s[key][-120:] == original['series'][ticker][key], (ticker, key)
            assert all(math.isfinite(v) and v > 0 for v in s[key]), (ticker, key)
        for op, hi, lo, cl, vol in zip(s['o'], s['h'], s['l'], s['c'], s['v']):
            assert lo <= min(op, cl) <= max(op, cl) <= hi, ticker
            assert vol == int(vol), ticker


if __name__ == '__main__':
    data = build()
    validate(data)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{OUT.name}: {len(data["series"])} tickers x {len(data["fechas"])} sessions; original values preserved.')
