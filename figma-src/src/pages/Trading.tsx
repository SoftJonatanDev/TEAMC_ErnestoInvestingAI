import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2 } from "lucide-react";
import { ASSETS } from "../data/demo";
import { useApp } from "../context";
import { AssetSelect, Card, Notice, PageHeader, Trend } from "../components/ui";

export default function Trading() {
  const { selectedTicker, cash, positions, trades, trade, selectedProfile } = useApp();
  const [side, setSide] = useState<"Compra" | "Venta">("Compra");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const asset = ASSETS.find((item) => item.ticker === selectedTicker)!;
  const portfolioValue = useMemo(
    () =>
      positions.reduce(
        (total, position) =>
          total +
          position.quantity * (ASSETS.find((item) => item.ticker === position.ticker)?.price ?? 0),
        cash,
      ),
    [positions, cash],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = trade(selectedTicker, side, Number(quantity));
    if (result) {
      setError(result);
      setSuccess("");
    } else {
      setError("");
      setSuccess(`${side} simulada ejecutada correctamente.`);
      setQuantity("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mercado DEMO"
        title="Trading simulado"
        description="Practica compras y ventas con efectivo virtual. No se ejecutan operaciones reales."
        action={<span className="profile-pill">Perfil cargado: {selectedProfile}</span>}
      />
      <Notice tone="warning">
        Simulación académica · sin conexión a brokers · precios sintéticos.
      </Notice>
      <div className="trading-summary">
        <Card>
          <span>Efectivo disponible</span>
          <strong>US$ {cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
        </Card>
        <Card>
          <span>Valor del portafolio</span>
          <strong>
            US$ {portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </strong>
        </Card>
        <Card>
          <span>Posiciones abiertas</span>
          <strong>{positions.length}</strong>
        </Card>
      </div>
      <div className="trading-grid">
        <Card className="order-card">
          <div className="card-head">
            <div>
              <span className="asset-kicker">Orden rápida</span>
              <h2>{asset.ticker}</h2>
            </div>
            <div className="price-summary">
              <strong>US$ {asset.price.toFixed(2)}</strong>
              <Trend value={asset.change} />
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="trade-tabs" role="group" aria-label="Tipo de operación">
              <button
                type="button"
                className={side === "Compra" ? "active buy" : ""}
                onClick={() => setSide("Compra")}
              >
                <ArrowDownToLine size={16} />
                Comprar
              </button>
              <button
                type="button"
                className={side === "Venta" ? "active sell" : ""}
                onClick={() => setSide("Venta")}
              >
                <ArrowUpFromLine size={16} />
                Vender
              </button>
            </div>
            <div className="field">
              <label htmlFor="trade-asset">Activo</label>
              <AssetSelect id="trade-asset" />
            </div>
            <div className="field">
              <label htmlFor="trade-quantity">Cantidad</label>
              <input
                id="trade-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                aria-describedby={error ? "trade-error" : undefined}
              />
              {error && (
                <span id="trade-error" className="field-error">
                  {error}
                </span>
              )}
            </div>
            <div className="order-estimate">
              <span>Precio indicativo</span>
              <strong>US$ {asset.price.toFixed(2)}</strong>
              <span>Total estimado</span>
              <strong>US$ {(asset.price * (Number(quantity) || 0)).toFixed(2)}</strong>
            </div>
            {success && (
              <div className="success-message">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}
            <button
              className={`button primary full ${side === "Venta" ? "danger" : ""}`}
              type="submit"
            >
              {side === "Compra" ? "Confirmar compra" : "Confirmar venta"}
            </button>
          </form>
        </Card>
        <Card>
          <h2>Posiciones</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>Cantidad</th>
                  <th>Precio prom.</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => {
                  const price = ASSETS.find((item) => item.ticker === position.ticker)!.price;
                  return (
                    <tr key={position.ticker}>
                      <td>
                        <b>{position.ticker}</b>
                      </td>
                      <td>{position.quantity}</td>
                      <td>US$ {position.average.toFixed(2)}</td>
                      <td>US$ {(position.quantity * price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card className="history-card">
        <div className="section-head">
          <h2>Historial de operaciones</h2>
          <span className="count-pill">{trades.length} operaciones</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Activo</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {trades.length ? (
                trades.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>
                      <span className={`side-badge ${item.side === "Compra" ? "buy" : "sell"}`}>
                        {item.side}
                      </span>
                    </td>
                    <td>
                      <b>{item.ticker}</b>
                    </td>
                    <td>{item.quantity}</td>
                    <td>US$ {item.price.toFixed(2)}</td>
                    <td>
                      <span className="status-badge">Ejecutada</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Aún no realizaste operaciones simuladas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
