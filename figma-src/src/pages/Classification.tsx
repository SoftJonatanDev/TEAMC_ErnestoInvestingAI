import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { Link } from "react-router";
import {
  ASSETS, ASSET_GROUPS, DL_MODELS, ML_MODELS, MODELS,
  classificationMetricsFor, modelProbability, type ClassificationModel,
} from "../data/demo";
import { useApp } from "../context";
import { AssetSelect, Card, Metric, Notice, PageHeader } from "../components/ui";

export default function Classification() {
  const { selectedTicker } = useApp();
  const [type, setType] = useState<"Todos" | "ML" | "DL">("Todos");
  const [group, setGroup] = useState("Todos");
  const [metricModel, setMetricModel] = useState<ClassificationModel>("Regresión logística");
  const assetIndex = ASSETS.findIndex((asset) => asset.ticker === selectedTicker);
  const visibleModels = type === "ML" ? ML_MODELS : type === "DL" ? DL_MODELS : MODELS;
  const rows = useMemo(() => visibleModels.map((model) => {
    const probability = modelProbability(MODELS.indexOf(model), assetIndex);
    return { model, probability, direction: probability >= 50 ? "SUBE" : "BAJA", type: ML_MODELS.includes(model as never) ? "ML" : "DL" };
  }), [visibleModels, assetIndex]);
  const upVotes = rows.filter((row) => row.direction === "SUBE").length;
  const mean = Math.round(rows.reduce((sum, row) => sum + row.probability, 0) / rows.length);
  const confidence = Math.abs(mean - 50) >= 8 ? "Alta" : Math.abs(mean - 50) >= 4 ? "Media" : "Baja";
  const groupAssets = group === "Todos" ? ASSETS : ASSETS.filter((asset) => asset.group === group);
  const selectedMetrics = classificationMetricsFor(MODELS.indexOf(metricModel), assetIndex);
  const metricRows = [
    ["Exactitud", selectedMetrics.accuracy], ["Precisión", selectedMetrics.precision],
    ["Recall", selectedMetrics.recall], ["F1", selectedMetrics.f1], ["AUC", selectedMetrics.auc],
  ] as const;
  const { tn, fp, fn, tp } = selectedMetrics.confusion;

  return (
    <>
      <PageHeader eyebrow="Modelos predictivos" title="Clasificación binaria" description="Probabilidad estimada de movimiento para la siguiente sesión." action={<div className="field compact"><label htmlFor="classification-asset">Activo</label><AssetSelect id="classification-asset" /></div>} />
      <Notice tone="warning"><b>Datos sintéticos · clasificación simulada.</b> No constituye asesoría de inversión.</Notice>
      <div className="filter-bar">
        <div className="segmented" role="group" aria-label="Filtrar modelos">
          {(["Todos", "ML", "DL"] as const).map((item) => <button key={item} className={type === item ? "active" : ""} aria-pressed={type === item} onClick={() => setType(item)}>{item === "Todos" ? "Todos los modelos" : item}</button>)}
        </div>
        <select aria-label="Grupo de activos" value={group} onChange={(event) => setGroup(event.target.value)}>
          {["Todos", ...ASSET_GROUPS].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="consensus-grid">
        <Card className="consensus-card">
          <span className="asset-kicker">Consenso · {selectedTicker}</span>
          <div className={`consensus-direction ${upVotes >= rows.length / 2 ? "up" : "down"}`}><span aria-hidden="true">{upVotes >= rows.length / 2 ? "▲" : "▼"}</span><strong>{upVotes >= rows.length / 2 ? "SUBE" : "BAJA"}</strong></div>
          <div className="vote-bar"><i className="up" style={{ width: `${(upVotes / rows.length) * 100}%` }} /><i className="down" style={{ width: `${((rows.length - upVotes) / rows.length) * 100}%` }} /></div>
          <div className="vote-labels"><span>▲ SUBE {upVotes}</span><span>▼ BAJA {rows.length - upVotes}</span></div>
        </Card>
        <div className="metric-grid three">
          <Metric label="Probabilidad media" value={`${mean}%`} detail="Promedio de modelos visibles" />
          <Metric label="Confianza" value={confidence} detail={`${rows.length} modelos evaluados`} />
          <Metric label="Acuerdo" value={`${Math.round((Math.max(upVotes, rows.length - upVotes) / rows.length) * 100)}%`} detail="Dirección mayoritaria" />
        </div>
      </div>
      <Card className="heatmap-card">
        <div className="section-head"><div><h2>Mapa de calor</h2><p>{groupAssets.length} activos × {rows.length} modelos · probabilidad de SUBE</p></div><span className="legend-inline"><i className="down" />▼ BAJA <i className="up" />▲ SUBE</span></div>
        <div className="heatmap-scroll">
          <table className="heatmap-table">
            <thead><tr><th>Modelo</th>{groupAssets.map((asset) => <th key={asset.ticker}>{asset.ticker}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.model}><th><span>{row.model}</span><small>{row.type}</small></th>{groupAssets.map((asset) => {
              const probability = modelProbability(MODELS.indexOf(row.model), ASSETS.indexOf(asset));
              const up = probability >= 50;
              return <td key={asset.ticker}><span className={up ? "prediction-up" : "prediction-down"}><b>{probability}%</b><small>{up ? "▲ SUBE" : "▼ BAJA"}</small></span></td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="analysis-selector field">
        <label htmlFor="metric-model">Métricas específicas del modelo</label>
        <select id="metric-model" value={metricModel} onChange={(event) => setMetricModel(event.target.value as ClassificationModel)}>{MODELS.map((model) => <option key={model}>{model}</option>)}</select>
      </div>
      <div className="analysis-grid">
        <Card><h2>Métricas de validación · {metricModel}</h2><div className="metric-list">{metricRows.map(([label, value]) => <div key={label}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><b>{value.toFixed(1)}%</b></div>)}</div><p className="explanation">Cada modelo conserva sus métricas y matriz propias para el activo seleccionado. Un resultado apenas superior al azar no implica capacidad predictiva estable.</p></Card>
        <Card><h2>Matriz de confusión · {metricModel}</h2><div className="confusion" role="img" aria-label={`Matriz de confusión de ${metricModel}: ${tn} verdaderos baja, ${fp} falsos sube, ${fn} falsos baja y ${tp} verdaderos sube`}><span /><span>Pred. BAJA</span><span>Pred. SUBE</span><b>Real BAJA</b><i className="correct"><strong>{tn}</strong><small>Verdadero BAJA</small></i><i><strong>{fp}</strong><small>Falso SUBE</small></i><b>Real SUBE</b><i><strong>{fn}</strong><small>Falso BAJA</small></i><i className="correct"><strong>{tp}</strong><small>Verdadero SUBE</small></i></div></Card>
      </div>
      <div className="context-link"><BrainCircuit size={18} /><span>¿Quieres explorar el precio futuro de <b>{selectedTicker}</b>?</span><Link className="button primary" to="/regresion">Ver regresión <ArrowRight size={16} /></Link></div>
    </>
  );
}
