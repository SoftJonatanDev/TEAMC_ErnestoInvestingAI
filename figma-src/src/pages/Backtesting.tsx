import { useMemo, useState } from "react";
import { Card, Notice, PageHeader, SimpleLineChart } from "../components/ui";

const names = ["Conservador", "Moderado", "Agresivo", "SPY", "QQQ", "EPU", "1/N"] as const;
const colors = ["#0B4F9C", "#6D5BD0", "#C06A17", "#0A7D3C", "#D64C7F", "#16A085", "#667085"];
const dailyPatterns = [
  [0.0005,0.0011,-0.0007,0.0009,0.0003,-0.0012,0.0014,0.0006,-0.0004,0.0008,-0.0002,0.0010,-0.0015,0.0007,0.0012,-0.0005,0.0004,0.0009,-0.0008,0.0013,0.0002],
  [0.0007,0.0016,-0.0011,0.0012,0.0004,-0.0018,0.0020,0.0008,-0.0006,0.0011,-0.0003,0.0014,-0.0020,0.0010,0.0016,-0.0007,0.0005,0.0012,-0.0011,0.0018,0.0003],
  [0.0010,0.0023,-0.0018,0.0017,0.0006,-0.0028,0.0031,0.0011,-0.0010,0.0016,-0.0005,0.0020,-0.0032,0.0014,0.0025,-0.0012,0.0008,0.0018,-0.0017,0.0027,0.0004],
  [0.0008,0.0017,-0.0012,0.0013,0.0005,-0.0020,0.0022,0.0009,-0.0007,0.0012,-0.0004,0.0015,-0.0022,0.0011,0.0018,-0.0008,0.0006,0.0013,-0.0012,0.0020,0.0003],
  [0.0011,0.0024,-0.0017,0.0018,0.0007,-0.0027,0.0030,0.0012,-0.0010,0.0017,-0.0005,0.0021,-0.0030,0.0015,0.0026,-0.0011,0.0008,0.0019,-0.0016,0.0028,0.0005],
  [0.0004,0.0018,-0.0021,0.0010,0.0002,-0.0030,0.0026,0.0007,-0.0014,0.0015,-0.0008,0.0017,-0.0035,0.0012,0.0020,-0.0015,0.0004,0.0014,-0.0020,0.0023,0.0001],
  [0.0006,0.0014,-0.0010,0.0011,0.0004,-0.0017,0.0019,0.0008,-0.0006,0.0010,-0.0003,0.0013,-0.0019,0.0009,0.0015,-0.0007,0.0005,0.0011,-0.0010,0.0017,0.0003],
];
const shockByMonth = [0, 0.001, -0.0015, 0.0005, -0.0003, 0.0012, -0.0022, 0.0008, 0.0002, -0.0007, 0.0014, -0.0004];

const seriesData = names.map((name, index) => {
  let capital = 100;
  const returns = Array.from({ length: 252 }, (_, day) => dailyPatterns[index][day % 21] + shockByMonth[Math.floor(day / 21)] * (0.35 + index * 0.06));
  const values = returns.map((dailyReturn) => (capital *= 1 + dailyReturn));
  return { name, color: colors[index], values, returns };
});

const weightsByProfile = {
  Conservador: "SPY 35% · XLV 25% · XLP 20% · XLU 20%",
  Moderado: "SPY 30% · QQQ 25% · AAPL 20% · XLF 15% · EPU 10%",
  Agresivo: "NVDA 30% · TSLA 20% · QQQ 20% · SCCO 15% · XLK 15%",
};
const rebalanceDates = ["02 dic 2025", "03 mar 2026", "03 jun 2026", "02 sep 2026"];

export default function Backtesting() {
  const [visible, setVisible] = useState<string[]>([...names]);
  const shown = seriesData.filter((item) => visible.includes(item.name));
  const drawdowns = shown.map((series) => ({ ...series, values: series.values.map((value, index) => {
    const peak = Math.max(100, ...series.values.slice(0, index + 1));
    return (value / peak - 1) * 100;
  }) }));
  const metrics = useMemo(() => seriesData.map((series) => {
    const total = series.values[251] / 100 - 1;
    const mean = series.returns.reduce((sum, value) => sum + value, 0) / 252;
    const variance = series.returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 251;
    const volatility = Math.sqrt(variance) * Math.sqrt(252);
    const sharpe = volatility ? (mean * 252 - 0.03) / volatility : 0;
    const dd = series.values.map((value, index) => value / Math.max(100, ...series.values.slice(0, index + 1)) - 1);
    const maxDrawdown = Math.min(...dd);
    const months = Array.from({ length: 12 }, (_, month) => {
      const start = month === 0 ? 100 : series.values[month * 21 - 1];
      return series.values[(month + 1) * 21 - 1] / start - 1;
    });
    return { name: series.name, total, cagr: total, volatility, sharpe, maxDrawdown, calmar: Math.abs(maxDrawdown) ? total / Math.abs(maxDrawdown) : 0, positiveMonths: months.filter((value) => value > 0).length };
  }), []);
  const bestReturn = [...metrics].sort((a, b) => b.total - a.total)[0];
  const bestSharpe = [...metrics].sort((a, b) => b.sharpe - a.sharpe)[0];

  return (
    <>
      <PageHeader eyebrow="Evaluación histórica" title="Backtesting" description="Compara perfiles y referencias durante 252 sesiones sobre la misma historia sintética." action={<span className="profile-pill">Base 100 · 252 sesiones</span>} />
      <Notice tone="warning"><b>Backtesting sobre historia sintética · desempeño pasado no garantiza desempeño futuro.</b></Notice>
      <Card className="backtest-card"><div className="section-head"><div><h2>Curvas de capital</h2><p>Valor acumulado con base 100.</p></div><div className="series-filter">{names.map((name, index) => <button key={name} className={visible.includes(name) ? "active" : ""} aria-pressed={visible.includes(name)} onClick={() => setVisible((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])}><i style={{ background: colors[index] }} />{name}</button>)}</div></div><SimpleLineChart series={shown} labels={["Sesión 1", "Sesión 252"]} height={330} ariaLabel="Curvas de capital base 100 durante 252 sesiones para tres portafolios y cuatro referencias" /></Card>
      <Card className="backtest-card"><div className="section-head"><div><h2>Drawdown</h2><p>Caída porcentual desde el máximo previo.</p></div></div><SimpleLineChart series={drawdowns} labels={["Sesión 1", "Sesión 252"]} height={220} ariaLabel="Drawdown durante 252 sesiones por estrategia" /></Card>
      <Card><div className="section-head"><h2>Métricas comparativas derivadas</h2><span>Calculadas desde las 252 observaciones mostradas.</span></div><div className="table-scroll"><table><thead><tr><th>Estrategia</th><th>Retorno total</th><th>CAGR</th><th>Volatilidad</th><th>Sharpe</th><th>Máx. drawdown</th><th>Calmar</th><th>Meses positivos</th></tr></thead><tbody>{metrics.map((row) => <tr key={row.name} className={row.name === bestReturn.name ? "benchmark-best" : ""}><td><b>{row.name}</b>{row.name === bestReturn.name && <em>Mejor retorno</em>}</td><td>{(row.total * 100).toFixed(1)}%</td><td>{(row.cagr * 100).toFixed(1)}%</td><td>{(row.volatility * 100).toFixed(1)}%</td><td>{row.sharpe.toFixed(2)}</td><td>{(row.maxDrawdown * 100).toFixed(1)}%</td><td>{row.calmar.toFixed(2)}</td><td>{row.positiveMonths}/12</td></tr>)}</tbody></table></div></Card>
      <div className="backtest-bottom">
        <Card><h2>Rebalanceos y pesos por fecha · DEMO</h2><div className="rebalance-list">{rebalanceDates.map((date, index) => <details key={date} open={index === 0}><summary><span><i />{date} · DEMO</span><b>{index === 0 ? "Inicio" : "Rebalanceo"}</b></summary>{Object.entries(weightsByProfile).map(([profile, weights]) => <p key={profile}><strong>{profile}</strong><span>{weights}</span></p>)}</details>)}</div></Card>
        <Card className="interpretation"><span className="asset-kicker">Interpretación dinámica</span><h2>{bestReturn.name} lidera el retorno</h2><p>En las 252 sesiones mostradas, {bestReturn.name} registra el mayor retorno total ({(bestReturn.total * 100).toFixed(1)}%), mientras {bestSharpe.name} presenta el Sharpe más alto ({bestSharpe.sharpe.toFixed(2)}).</p><p>La lectura cambia automáticamente con los resultados calculados; retorno, volatilidad y drawdown deben evaluarse en conjunto.</p></Card>
      </div>
    </>
  );
}
