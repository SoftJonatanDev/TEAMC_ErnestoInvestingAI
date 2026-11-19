import { useState } from "react";
import { BellPlus, Trash2, X } from "lucide-react";
import { ASSETS } from "../data/demo";
import { useApp } from "../context";
import { Card, Notice, PageHeader, Trend } from "../components/ui";

const spark = (price: number) =>
  Array.from({ length: 16 }, (_, i) => 18 + Math.sin(i * 0.8 + price) * 9 + i * 0.2);

export default function Watchlist() {
  const { watchlist, toggleWatchlist, alerts, addAlert, removeAlert, setSelectedTicker } = useApp();
  const [ticker, setTicker] = useState("SPY");
  const [kind, setKind] = useState<"Precio" | "Variación">("Precio");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const watched = ASSETS.filter((asset) => watchlist.includes(asset.ticker));

  const createAlert = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(target);
    if (!target || !Number.isFinite(value)) {
      setError("Ingresa un valor numérico válido.");
      return;
    }
    addAlert({ ticker, kind, target: value });
    setTarget("");
    setError("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="Watchlist y alertas"
        description="Sigue tus activos favoritos y recibe señales simuladas de precio o variación."
        action={<span className="count-pill">{watched.length} activos guardados</span>}
      />
      <Notice>
        Las alertas son demostrativas y no envían notificaciones fuera de esta aplicación.
      </Notice>
      <div className="watch-grid">
        <div>
          <div className="section-head">
            <h2>Activos guardados</h2>
            <select
              aria-label="Agregar activo a Watchlist"
              value=""
              onChange={(event) => event.target.value && toggleWatchlist(event.target.value)}
            >
              <option value="">+ Agregar activo</option>
              {ASSETS.filter((asset) => !watchlist.includes(asset.ticker)).map((asset) => (
                <option key={asset.ticker} value={asset.ticker}>
                  {asset.ticker}
                </option>
              ))}
            </select>
          </div>
          {watched.length ? (
            <div className="asset-card-grid">
              {watched.map((asset) => {
                const values = spark(asset.price);
                const points = values.map((value, i) => `${i * 8},${value}`).join(" ");
                return (
                  <Card key={asset.ticker} className="watch-card">
                    <div className="card-head">
                      <button
                        className="asset-title"
                        onClick={() => setSelectedTicker(asset.ticker)}
                      >
                        <span className="ticker-logo">{asset.ticker.slice(0, 2)}</span>
                        <span>
                          <b>{asset.ticker}</b>
                          <small>{asset.name}</small>
                        </span>
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => toggleWatchlist(asset.ticker)}
                        aria-label={`Quitar ${asset.ticker} de Watchlist`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                    <div className="watch-price">
                      <span>
                        <strong>US$ {asset.price.toFixed(2)}</strong>
                        <Trend value={asset.change} />
                      </span>
                      <svg
                        viewBox="0 0 120 42"
                        role="img"
                        aria-label={`Mini gráfico de ${asset.ticker}`}
                      >
                        <polyline
                          points={points}
                          fill="none"
                          className={asset.change >= 0 ? "spark-up" : "spark-down"}
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                    <button className="button ghost small" onClick={() => setTicker(asset.ticker)}>
                      <BellPlus size={15} />
                      Crear alerta
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="empty">
              <h3>Tu Watchlist está vacía</h3>
              <p>Agrega un activo para comenzar a seguirlo.</p>
            </Card>
          )}
        </div>

        <div className="alert-column">
          <Card>
            <h2>Nueva alerta</h2>
            <form onSubmit={createAlert} className="form-stack">
              <div className="field">
                <label htmlFor="alert-asset">Activo</label>
                <select
                  id="alert-asset"
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value)}
                >
                  {ASSETS.map((asset) => (
                    <option key={asset.ticker}>{asset.ticker}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="alert-kind">Tipo de alerta</label>
                <select
                  id="alert-kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as typeof kind)}
                >
                  <option>Precio</option>
                  <option>Variación</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="alert-value">
                  {kind === "Precio" ? "Precio objetivo (US$)" : "Variación objetivo (%)"}
                </label>
                <input
                  id="alert-value"
                  type="number"
                  step="0.01"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  aria-describedby={error ? "alert-error" : undefined}
                />
                {error && (
                  <span id="alert-error" className="field-error">
                    {error}
                  </span>
                )}
              </div>
              <button className="button primary" type="submit">
                <BellPlus size={16} />
                Crear alerta
              </button>
            </form>
          </Card>
          <Card>
            <div className="section-head">
              <h2>Alertas</h2>
              <span className="count-pill">{alerts.length}</span>
            </div>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div className={`alert-row ${alert.triggered ? "triggered" : ""}`} key={alert.id}>
                  <span className="alert-icon" aria-hidden="true">
                    {alert.triggered ? "!" : "○"}
                  </span>
                  <span>
                    <b>
                      {alert.ticker} · {alert.kind}
                    </b>
                    <small>
                      {alert.kind === "Precio" ? "US$ " : ""}
                      {alert.target}
                      {alert.kind === "Variación" ? "%" : ""}
                    </small>
                  </span>
                  <span className="status-badge">{alert.triggered ? "Activada" : "Activa"}</span>
                  <button
                    className="icon-button"
                    onClick={() => removeAlert(alert.id)}
                    aria-label={`Eliminar alerta de ${alert.ticker}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
