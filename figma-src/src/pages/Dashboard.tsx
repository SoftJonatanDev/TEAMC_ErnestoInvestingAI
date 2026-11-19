import { useMemo, useState } from "react";
import { BellPlus, Star } from "lucide-react";
import { Link } from "react-router";
import { ASSETS, ASSET_GROUPS, historyFor, type AssetGroup } from "../data/demo";
import { useApp } from "../context";
import { AssetSelect, Card, Notice, PageHeader, Trend } from "../components/ui";

function CandleChart({ ticker }: { ticker: string }) {
  const asset = ASSETS.find((item) => item.ticker === ticker)!;
  const data = useMemo(() => historyFor(asset), [asset]);
  const min = Math.min(...data.map((item) => item.low));
  const max = Math.max(...data.map((item) => item.high));
  const y = (value: number) => 245 - ((value - min) / (max - min)) * 210;
  const candleWidth = 6.2;
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 920 270"
        className="candle-chart"
        role="img"
        aria-label={`Gráfico de velas de ${ticker}, 120 sesiones sintéticas`}
      >
        {[0, 1, 2, 3, 4].map((tick) => (
          <line
            key={tick}
            x1="40"
            x2="900"
            y1={25 + tick * 52}
            y2={25 + tick * 52}
            className="grid-line"
          />
        ))}
        {data.map((item, index) => {
          const x = 42 + index * 7.1;
          const up = item.close >= item.open;
          return (
            <g key={index} className={up ? "candle-up" : "candle-down"}>
              <line
                x1={x + candleWidth / 2}
                x2={x + candleWidth / 2}
                y1={y(item.high)}
                y2={y(item.low)}
              />
              <rect
                x={x}
                y={Math.min(y(item.open), y(item.close))}
                width={candleWidth}
                height={Math.max(1.5, Math.abs(y(item.open) - y(item.close)))}
                rx=".5"
              />
            </g>
          );
        })}
        <text x="40" y="265">
          120 sesiones
        </text>
        <text x="900" y="265" textAnchor="end">
          Actual
        </text>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { selectedTicker, setSelectedTicker, watchlist, toggleWatchlist } = useApp();
  const [group, setGroup] = useState<"Todos" | AssetGroup>("Todos");
  const selected = ASSETS.find((item) => item.ticker === selectedTicker)!;
  const filtered = group === "Todos" ? ASSETS : ASSETS.filter((item) => item.group === group);
  return (
    <>
      <PageHeader
        eyebrow="Mercados"
        title="Dashboard"
        description="Panorama de mercado y seguimiento del universo de inversión."
        action={
          <div className="field compact">
            <label htmlFor="dashboard-asset">Activo</label>
            <AssetSelect id="dashboard-asset" />
          </div>
        }
      />
      <Notice>
        Datos de mercado sintéticos para fines académicos. Universo fijo de 26 activos.
      </Notice>

      <div className="market-cards">
        {ASSETS.filter((asset) => ["SPY", "QQQ", "EPU"].includes(asset.ticker)).map((asset) => (
          <button
            key={asset.ticker}
            className={`market-card ${selectedTicker === asset.ticker ? "selected" : ""}`}
            onClick={() => setSelectedTicker(asset.ticker)}
          >
            <span>
              <b>{asset.ticker}</b>
              <small>{asset.name}</small>
            </span>
            <span>
              <strong>US$ {asset.price.toFixed(2)}</strong>
              <Trend value={asset.change} />
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="card-head">
            <div>
              <span className="asset-kicker">{selected.group}</span>
              <h2>
                {selected.ticker} <small>{selected.name}</small>
              </h2>
            </div>
            <div className="price-summary">
              <strong>US$ {selected.price.toFixed(2)}</strong>
              <Trend value={selected.change} />
            </div>
          </div>
          <CandleChart ticker={selectedTicker} />
          <div className="chart-foot">
            <span>OHLC · cierre ajustado</span>
            <span>120 sesiones simuladas</span>
          </div>
        </Card>

        <Card className="universe-card">
          <div className="card-head">
            <div>
              <h2>Universo</h2>
              <p>26 activos</p>
            </div>
            <select
              aria-label="Filtrar por grupo"
              value={group}
              onChange={(event) => setGroup(event.target.value as typeof group)}
            >
              {["Todos", ...ASSET_GROUPS].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="asset-list">
            {filtered.map((asset) => (
              <button
                key={asset.ticker}
                onClick={() => setSelectedTicker(asset.ticker)}
                className={asset.ticker === selectedTicker ? "selected" : ""}
              >
                <span className="ticker-logo">{asset.ticker.slice(0, 2)}</span>
                <span>
                  <b>{asset.ticker}</b>
                  <small>{asset.name}</small>
                </span>
                <span>
                  <strong>{asset.price.toFixed(2)}</strong>
                  <Trend value={asset.change} />
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="quick-actions" aria-label="Acciones rápidas">
        <button className="button secondary" onClick={() => toggleWatchlist(selectedTicker)}>
          <Star size={16} fill={watchlist.includes(selectedTicker) ? "currentColor" : "none"} />
          {watchlist.includes(selectedTicker) ? "Quitar de Watchlist" : "Agregar a Watchlist"}
        </button>
        <Link className="button ghost" to="/watchlist">
          <BellPlus size={16} />
          Configurar alerta
        </Link>
      </div>
    </>
  );
}
