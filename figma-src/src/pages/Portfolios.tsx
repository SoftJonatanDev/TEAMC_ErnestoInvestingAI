import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { PORTFOLIOS, type Profile } from "../data/demo";
import { useApp } from "../context";
import { Card, Donut, Notice, PageHeader } from "../components/ui";

const colors = ["#0B4F9C", "#6D5BD0", "#0A7D3C", "#C06A17", "#D64C7F"];

export default function Portfolios() {
  const { selectedProfile, setSelectedProfile, loadPortfolioToTrading } = useApp();
  const navigate = useNavigate();
  const selected = PORTFOLIOS[selectedProfile];
  const sendToTrading = () => {
    loadPortfolioToTrading(selectedProfile);
    navigate("/trading");
  };
  return (
    <>
      <PageHeader
        eyebrow="Perfiles sugeridos"
        title="Portafolios"
        description="Compara tres asignaciones simuladas según tolerancia al riesgo."
        action={<span className="profile-pill">Seleccionado: {selectedProfile}</span>}
      />
      <Notice>
        Composiciones basadas en señales sintéticas de Clasificación y Regresión. No son
        recomendaciones de inversión.
      </Notice>
      <div className="portfolio-cards">
        {(Object.keys(PORTFOLIOS) as Profile[]).map((profile) => {
          const data = PORTFOLIOS[profile];
          return (
            <Card
              key={profile}
              className={`portfolio-card ${selectedProfile === profile ? "selected" : ""}`}
            >
              <button
                className="portfolio-select"
                onClick={() => setSelectedProfile(profile)}
                aria-pressed={selectedProfile === profile}
              >
                <span className="profile-dot" style={{ background: data.color }} />
                <span>
                  <small>Perfil</small>
                  <h2>{profile}</h2>
                </span>
                {selectedProfile === profile && <CheckCircle2 size={20} />}
              </button>
              <Donut
                label={`Composición del perfil ${profile}`}
                items={data.assets.map((asset, i) => ({
                  name: asset.ticker,
                  value: asset.weight,
                  color: colors[i],
                }))}
              />
              <div className="portfolio-metrics">
                <span>
                  Retorno esperado<b>{data.expectedReturn}%</b>
                </span>
                <span>
                  Volatilidad<b>{data.volatility}%</b>
                </span>
                <span>
                  Sharpe<b>{data.sharpe}</b>
                </span>
                <span>
                  CVaR 95 %<b>{data.cvar95}%</b>
                </span>
              </div>
              <div className="mini-weights">
                {data.assets.map((asset, i) => (
                  <span key={asset.ticker}>
                    <i style={{ background: colors[i] }} />
                    {asset.ticker} <b>{asset.weight}%</b>
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="portfolio-detail">
        <div className="section-head">
          <div>
            <span className="asset-kicker">Detalle seleccionado</span>
            <h2>Portafolio {selectedProfile}</h2>
          </div>
          <button className="button primary" onClick={sendToTrading}>
            Llevar a Trading <ArrowRight size={16} />
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Activo</th>
                <th>Peso</th>
                <th>Grupo</th>
                <th>Razón de inclusión</th>
                <th>Señales relacionadas</th>
              </tr>
            </thead>
            <tbody>
              {selected.assets.map((asset) => (
                <tr key={asset.ticker}>
                  <td>
                    <b>{asset.ticker}</b>
                  </td>
                  <td>
                    <span className="weight-cell">
                      <i>
                        <b style={{ width: `${asset.weight * 2}%` }} />
                      </i>
                      {asset.weight}%
                    </span>
                  </td>
                  <td>{asset.group}</td>
                  <td>{asset.inclusionReason}</td>
                  <td>
                    <span className="signal-tags">
                      <em>Clasificación</em>
                      <em>Regresión</em>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
