"""Check new history against unchanged originals and reproducible generation."""
from __future__ import annotations
import hashlib
import json
import statistics
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_extended_ohlcv import build, validate

def main() -> None:
    checks=[]
    def check(test,ok,detail=None):
        checks.append({'test':test,'passed':bool(ok),'detail':detail})
        print(('PASS ' if ok else 'FAIL ')+test)
    load=lambda name:json.loads((ROOT/'data'/name).read_text(encoding='utf-8'))
    ext=load('14_ohlcv_sintetico_504d.json');validate(ext)
    check('26 assets x 504 valid OHLCV observations',len(ext['series'])==26 and len(ext['fechas'])==504)
    check('Deterministic generator reproduces delivered data',build()==ext)
    hashes=json.loads((ROOT/'docs/fuentes-originales.sha256.json').read_text())
    for name,digest in hashes.items():
        check('Original source unchanged: '+Path(name).name,hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest)
    hist=load('02_precios_sinteticos_504d.json');reg=load('06_regresores_precio_30d.json');dash=load('10_dashboard_mercado.json')
    check('All dashboard anchors match full history',all(row['ultimo']==hist['cierres'][row['ticker']][-1] for row in dash))
    dates=reg['fechas_pronostico']
    check('Forecast dates begin after history; exactly 30',len(dates)==30 and dates[0]>hist['fechas'][-1] and dates==sorted(set(dates)))
    median_error=0.;return_error=0.;valid=True
    for ticker,pred in reg['predicciones'].items():
        valid &= pred['precio_ultimo']==hist['cierres'][ticker][-1] and len(pred['modelos'])==18
        valid &= all(len(m['precios'])==30 for m in pred['modelos'])
        for i,median in enumerate(pred['ensamble_mediana']):
            valid &= pred['banda_p10'][i]<=median<=pred['banda_p90'][i]
            median_error=max(median_error,abs(statistics.median(m['precios'][i] for m in pred['modelos'])-median))
        return_error=max(return_error,abs((pred['ensamble_mediana'][-1]/pred['precio_ultimo']-1)*100-pred['retorno_proyectado_30d_pct']))
    check('All regression anchors, 18 models and bands consistent',valid)
    check('Stored median agrees within source rounding',median_error<=.011,median_error)
    check('Projected returns agree within source rounding',return_error<=.02,return_error)
    bt=load('09_backtesting_portafolios.json')
    for name,data in (bt['carteras']|bt['referencias']).items():
        vals=data['curva'];ret=(vals[-1]/vals[0]-1)*100;peak=-1;dd=[]
        for value in vals:
            peak=max(peak,value);dd.append((value/peak-1)*100)
        check('Backtesting curve and reported result: '+name,len(vals)==len(bt['fechas'])==253 and vals[0]==100 and abs(ret-data['metricas']['retorno_total_pct'])<=.011 and abs(min(dd)-data['metricas']['max_drawdown_pct'])<=.011)
    opt=load('07_optimizador_markowitz_nsga.json')
    pts=[p for key in ['markowitz_universo_completo','markowitz_elegibles','nsga2_elegibles','nsga3_elegibles'] for p in opt[key]]
    check('170 original portfolios, weight limits unchanged',len(pts)==170 and all(abs(sum(p['pesos'].values())-1)<=.02 and max(p['pesos'].values())<=.25 for p in pts))
    (ROOT/'test-results').mkdir(exist_ok=True)
    (ROOT/'test-results/chart-data-integrity.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if not all(c['passed'] for c in checks):raise SystemExit(1)
    print(f'COMPLETE: {len(checks)} checks passed.')

if __name__=='__main__':
    main()
