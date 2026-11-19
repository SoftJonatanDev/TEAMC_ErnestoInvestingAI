import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";
import { OPTIMIZER_POINTS, type FrontierPoint, type OptimizerMethod } from "../data/demo";
import { Card, Metric, Notice, PageHeader } from "../components/ui";

const colors: Record<OptimizerMethod, string> = { Markowitz: "#0B4F9C", "NSGA-II": "#0A7D3C", "NSGA-III": "#C06A17" };

export default function Optimizer() {
  const [visible, setVisible] = useState<OptimizerMethod[]>(["Markowitz", "NSGA-II", "NSGA-III"]);
  const [universe, setUniverse] = useState<"Completo" | "Elegibles">("Completo");
  const points = useMemo(() => OPTIMIZER_POINTS.filter((point) => point.universe === universe), [universe]);
  const [selected, setSelected] = useState<FrontierPoint>(OPTIMIZER_POINTS.find((point) => point.id === "NSGA-III-Completo-2")!);
  const chooseUniverse = (next: "Completo" | "Elegibles") => {
    setUniverse(next);
    setSelected(OPTIMIZER_POINTS.find((point) => point.universe === next && point.method === selected.method) ?? OPTIMIZER_POINTS[0]);
  };
  const x = (value: number) => 55 + ((value - 5) / 20) * 790;
  const y = (value: number) => 315 - ((value - 3) / 16) * 270;
  const toggle = (method: OptimizerMethod) => setVisible((items) => items.includes(method) ? items.filter((item) => item !== method) : [...items, method]);
  return (
    <>
      <PageHeader eyebrow="Asignación multiobjetivo" title="Optimizador" description="Compara retorno esperado, volatilidad y riesgo de cola entre métodos." action={<div className="segmented"><button className={universe === "Completo" ? "active" : ""} onClick={() => chooseUniverse("Completo")}>Universo completo</button><button className={universe === "Elegibles" ? "active" : ""} onClick={() => chooseUniverse("Elegibles")}>Solo elegibles</button></div>} />
      <Notice tone="warning"><b>NSGA-II y NSGA-III simulados: no se ejecutó ningún algoritmo evolutivo.</b></Notice>
      <Card className="optimizer-card">
        <div className="section-head"><div><h2>Fronteras riesgo–retorno</h2><p>Markowitz {universe.toLowerCase()}, NSGA-II y NSGA-III · selecciona un punto.</p></div><div className="method-toggles">{(Object.keys(colors) as OptimizerMethod[]).map((method) => <button key={method} className={visible.includes(method) ? "active" : ""} aria-pressed={visible.includes(method)} onClick={() => toggle(method)}><span className="check-box">{visible.includes(method) && <Check size={12} />}</span><i style={{ background: colors[method] }} />{method}</button>)}</div></div>
        <div className="scatter-wrap"><svg viewBox="0 0 900 360" role="img" aria-label={`Fronteras eficientes para universo ${universe.toLowerCase()}, riesgo en eje X y retorno en eje Y`}>{[0,1,2,3,4].map((tick) => <line key={tick} x1="55" x2="865" y1={45 + tick * 67.5} y2={45 + tick * 67.5} className="grid-line" />)}<text x="450" y="352" textAnchor="middle">Riesgo / volatilidad (%)</text><text x="15" y="180" transform="rotate(-90 15 180)" textAnchor="middle">Retorno esperado (%)</text>{points.filter((point) => visible.includes(point.method)).map((point) => <circle key={point.id} cx={x(point.volatility)} cy={y(point.expectedReturn)} r={point.method === "NSGA-III" ? Math.abs(point.cvar95) * 0.65 : 5} fill={colors[point.method]} opacity=".82" tabIndex={0} onClick={() => setSelected(point)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(point)}><title>{point.method}: retorno {point.expectedReturn.toFixed(1)}%, volatilidad {point.volatility.toFixed(1)}%, CVaR {point.cvar95.toFixed(1)}%</title></circle>)}</svg><p className="chart-caption">En NSGA-III, el tamaño del punto representa la magnitud del CVaR 95 %.</p></div>
      </Card>
      <div className="optimizer-detail">
        <Card><span className="asset-kicker">Punto seleccionado · {selected.universe}</span><h2>{selected.method}</h2><div className="metric-grid two"><Metric label="Retorno" value={`${selected.expectedReturn.toFixed(1)}%`} /><Metric label="Volatilidad" value={`${selected.volatility.toFixed(1)}%`} /><Metric label="Sharpe" value={selected.sharpe.toFixed(2)} /><Metric label="CVaR 95 %" value={`${selected.cvar95.toFixed(1)}%`} /></div><h3>Pesos del portafolio</h3><div className="weight-list">{selected.weights.map(({ ticker, weight }) => <div key={ticker}><span><b>{ticker}</b><em>{weight}%</em></span><i><b style={{ width: `${weight}%` }} /></i></div>)}</div></Card>
        <Card><h2>Cómo leer los métodos</h2><div className="method-explain"><div><i style={{ background: colors.Markowitz }} /><span><b>Markowitz {universe.toLowerCase()}</b><small>Frontera explícita correspondiente al universo seleccionado.</small></span></div><div><i style={{ background: colors["NSGA-II"] }} /><span><b>NSGA-II</b><small>Representación simulada de soluciones no dominadas para dos objetivos.</small></span></div><div><i style={{ background: colors["NSGA-III"] }} /><span><b>NSGA-III</b><small>Representación simulada que incorpora CVaR 95 % como tercer objetivo.</small></span></div></div><Link className="button primary full" to="/portafolios">Comparar portafolios <ArrowRight size={16} /></Link></Card>
      </div>
    </>
  );
}
