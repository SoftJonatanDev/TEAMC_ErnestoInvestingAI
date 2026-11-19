import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router";
import { ASSETS, REGRESSION_ML_MODELS, REGRESSION_MODELS } from "../data/demo";
import { useApp } from "../context";
import { AssetSelect, Card, Metric, Notice, PageHeader, Trend } from "../components/ui";

const colors = [
  "#0B4F9C",
  "#0A7D3C",
  "#B3261E",
  "#6D5BD0",
  "#C06A17",
  "#D64C7F",
  "#16A085",
  "#546E7A",
  "#7B61A8",
];
const forecastModels = REGRESSION_MODELS.map((name, index) => ({
  name,
  type: REGRESSION_ML_MODELS.includes(name as never) ? ("ML" as const) : ("DL" as const),
  color: colors[index % colors.length],
}));

const percentile = (values: number[], probability: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  const upperValue = sorted[lower + 1] ?? sorted[lower];
  return sorted[lower] + (upperValue - sorted[lower]) * fraction;
};

const financialHistory = (ticker: string, currentPrice: number) => {
  let seed = [...ticker].reduce((total, character) => total + character.charCodeAt(0), 317);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const returns = Array.from({ length: 59 }, (_, index) => {
    const regime = index < 14 ? 0.0005 : index < 27 ? -0.00025 : index < 44 ? 0.00075 : 0.00015;
    const clusteredVolatility = index > 20 && index < 29 ? 0.012 : 0.007;
    const pullback = index === 23 ? -0.018 : index === 39 ? 0.014 : 0;
    return regime + (random() + random() - 1) * clusteredVolatility + pullback;
  });
  const relative = [1];
  returns.forEach((value) => relative.push(relative.at(-1)! * (1 + value)));
  const scale = currentPrice / relative.at(-1)!;
  return relative.map((value) => value * scale);
};

type ForecastModel = (typeof forecastModels)[number] & { values: number[] };

function ForecastChart({
  history,
  models,
  median,
  low,
  high,
  ticker,
}: {
  history: number[];
  models: ForecastModel[];
  median: number[];
  low: number[];
  high: number[];
  ticker: string;
}) {
  const width = 960;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 42, left: 72 };
  const lastHistoryIndex = history.length - 1;
  const totalPoints = history.length + 30;
  const plottedValues = [...history, ...models.flatMap((model) => model.values), ...low, ...high];
  const rawMin = Math.min(...plottedValues);
  const rawMax = Math.max(...plottedValues);
  const verticalMargin = Math.max((rawMax - rawMin) * 0.08, history.at(-1)! * 0.004);
  const min = rawMin - verticalMargin;
  const max = rawMax + verticalMargin;
  const x = (index: number) =>
    padding.left + index * ((width - padding.left - padding.right) / (totalPoints - 1));
  const y = (value: number) =>
    height -
    padding.bottom -
    ((value - min) / (max - min || 1)) * (height - padding.top - padding.bottom);
  const linePath = (values: number[], startIndex: number) =>
    values
      .map((value, index) => `${index ? "L" : "M"} ${x(startIndex + index)} ${y(value)}`)
      .join(" ");
  const historyPath = linePath(history, 0);
  const forecastPath = (values: number[]) =>
    linePath([history.at(-1)!, ...values], lastHistoryIndex);
  const bandPath = [
    ...high.map((value, index) => `${index ? "L" : "M"} ${x(history.length + index)} ${y(value)}`),
    ...low
      .map((value, index) => ({ value, index }))
      .reverse()
      .map(({ value, index }) => `L ${x(history.length + index)} ${y(value)}`),
    "Z",
  ].join(" ");
  const yTicks = Array.from({ length: 5 }, (_, index) => max - index * ((max - min) / 4));
  const todayX = x(lastHistoryIndex);

  return (
    <div className="forecast-chart">
      <div className="forecast-chart-scroll">
        <svg
          className="regression-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Historia de 60 sesiones y pronóstico simulado de 30 sesiones para ${ticker}; modelos individuales, mediana y banda p10 a p90`}
        >
          <rect
            className="forecast-zone"
            x={todayX}
            y={padding.top}
            width={width - padding.right - todayX}
            height={height - padding.top - padding.bottom}
          />
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                className="grid-line"
                x1={padding.left}
                x2={width - padding.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="axis-label axis-price"
                x={padding.left - 12}
                y={y(tick) + 4}
                textAnchor="end"
              >
                US$ {tick.toFixed(tick < 20 ? 2 : 0)}
              </text>
            </g>
          ))}
          <path className="forecast-band" d={bandPath} />
          {models.map((model) => (
            <path
              key={model.name}
              className="model-forecast-line"
              d={forecastPath(model.values)}
              fill="none"
              stroke={model.color}
            />
          ))}
          <path className="history-line" d={historyPath} fill="none" />
          <path className="median-halo" d={forecastPath(median)} fill="none" />
          <path className="median-line" d={forecastPath(median)} fill="none" />
          <line
            className="today-divider"
            x1={todayX}
            x2={todayX}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          <circle className="today-point" cx={todayX} cy={y(history.at(-1)!)} r="4" />
          <g className="today-label">
            <rect x={todayX - 21} y={padding.top - 23} width="42" height="20" rx="5" />
            <text x={todayX} y={padding.top - 9} textAnchor="middle">
              Hoy
            </text>
          </g>
          <text className="axis-label" x={padding.left} y={height - 12}>
            60 sesiones atrás
          </text>
          <text className="axis-label axis-today" x={todayX} y={height - 12} textAnchor="middle">
            Hoy
          </text>
          <text className="axis-label" x={width - padding.right} y={height - 12} textAnchor="end">
            +30 sesiones
          </text>
        </svg>
      </div>
      <div className="forecast-legend" aria-label="Leyenda del gráfico">
        <span>
          <i className="legend-history" />
          Historia
        </span>
        <span>
          <i className="legend-models" />
          Modelos individuales
        </span>
        <span>
          <i className="legend-median" />
          Mediana del ensamble
        </span>
        <span>
          <i className="legend-band" />
          Banda p10–p90
        </span>
      </div>
    </div>
  );
}

export default function Regression() {
  const { selectedTicker } = useApp();
  const [filter, setFilter] = useState<"Todos" | "ML" | "DL">("Todos");
  const [enabled, setEnabled] = useState<string[]>([...REGRESSION_MODELS]);
  const asset = ASSETS.find((item) => item.ticker === selectedTicker)!;
  const history = useMemo(() => financialHistory(asset.ticker, asset.price), [asset]);
  const predictions = useMemo(
    () =>
      forecastModels.map((model, modelIndex) => ({
        ...model,
        values: Array.from({ length: 30 }, (_, index) => {
          const horizon = index + 1;
          const modelBias = ((modelIndex % 7) - 3) * 0.00011;
          const familyBias = model.type === "DL" ? 0.00008 : -0.00002;
          const sharedTrend = 0.00055 * horizon;
          const gradualDispersion = (modelBias + familyBias) * Math.pow(horizon, 1.22);
          const irregularity =
            Math.sin(horizon * (0.23 + (modelIndex % 4) * 0.018) + modelIndex * 0.83) *
            (0.0007 + Math.sqrt(horizon) * 0.00034);
          const localCorrection = Math.cos(horizon * 0.47 + modelIndex * 0.31) * 0.0008;
          return (
            asset.price * (1 + sharedTrend + gradualDispersion + irregularity + localCorrection)
          );
        }),
      })),
    [asset],
  );
  const visible = predictions.filter(
    (model) => enabled.includes(model.name) && (filter === "Todos" || model.type === filter),
  );
  const filteredModels = predictions.filter((model) => filter === "Todos" || model.type === filter);
  const ensembleModels = visible.length ? visible : filteredModels;
  const median = Array.from({ length: 30 }, (_, index) =>
    percentile(
      ensembleModels.map((model) => model.values[index]),
      0.5,
    ),
  );
  const lowForecast = Array.from({ length: 30 }, (_, index) =>
    percentile(
      ensembleModels.map((model) => model.values[index]),
      0.1,
    ),
  );
  const highForecast = Array.from({ length: 30 }, (_, index) =>
    percentile(
      ensembleModels.map((model) => model.values[index]),
      0.9,
    ),
  );
  const projected = (median[median.length - 1] / asset.price - 1) * 100;

  return (
    <>
      <PageHeader
        eyebrow="Pronóstico probabilístico"
        title="Regresión de precios a 30 sesiones"
        description="Historia reciente, 18 estimaciones por modelo y rango de incertidumbre."
        action={
          <div className="field compact">
            <label htmlFor="regression-asset">Activo</label>
            <AssetSelect id="regression-asset" />
          </div>
        }
      />
      <Notice tone="warning">
        <b>Datos sintéticos · pronóstico simulado · no es asesoría de inversión.</b>
      </Notice>
      <div className="regression-top">
        <Card className="projection-card">
          <span>Retorno proyectado a 30 sesiones</span>
          <Trend value={projected} />
          <small>Mediana del ensamble · escenario, no certeza</small>
        </Card>
        <div className="metric-grid three">
          <Metric
            label="Precio actual"
            value={`US$ ${asset.price.toFixed(2)}`}
            detail={asset.ticker}
          />
          <Metric
            label="Mediana día 30"
            value={`US$ ${median[29].toFixed(2)}`}
            detail="Estimación central"
          />
          <Metric
            label="Banda p10–p90"
            value={`US$ ${lowForecast[29].toFixed(0)}–${highForecast[29].toFixed(0)}`}
            detail="Dispersión entre modelos"
          />
        </div>
      </div>
      <Card className="forecast-card">
        <div className="section-head">
          <div>
            <h2>Historia y pronóstico</h2>
            <p>La línea vertical separa observaciones y 30 sesiones futuras.</p>
          </div>
          <div className="segmented">
            {(["Todos", "ML", "DL"] as const).map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item === "Todos" ? "Todos los modelos" : `Solo ${item}`}
              </button>
            ))}
          </div>
        </div>
        <ForecastChart
          history={history}
          models={visible}
          median={median}
          low={lowForecast}
          high={highForecast}
          ticker={asset.ticker}
        />
      </Card>
      <div className="analysis-grid">
        <Card>
          <div className="section-head">
            <div>
              <h2>Modelos visibles</h2>
              <p>{enabled.length} de 18 modelos</p>
            </div>
            <button
              className="button ghost small"
              onClick={() => setEnabled(enabled.length === 18 ? [] : [...REGRESSION_MODELS])}
            >
              {enabled.length === 18 ? "Ocultar todos" : "Mostrar todos"}
            </button>
          </div>
          <div className="model-toggles">
            {forecastModels.map((model) => {
              const active = enabled.includes(model.name);
              return (
                <button
                  key={model.name}
                  className={active ? "active" : ""}
                  aria-pressed={active}
                  onClick={() =>
                    setEnabled((items) =>
                      active ? items.filter((item) => item !== model.name) : [...items, model.name],
                    )
                  }
                >
                  {active ? <Eye size={16} /> : <EyeOff size={16} />}
                  <i style={{ background: model.color }} />
                  {model.name}
                  <small>{model.type}</small>
                </button>
              );
            })}
          </div>
          <p className="explanation">
            La banda p10–p90 se calcula en cada sesión con la dispersión de los modelos incluidos en
            la vista.
          </p>
        </Card>
        <Card>
          <h2>Métricas de validación · 18 regresores</h2>
          <div className="table-scroll regression-metrics">
            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>MAPE</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>R²</th>
                  <th>vs. persistencia</th>
                </tr>
              </thead>
              <tbody>
                {forecastModels.map((model, i) => (
                  <tr key={model.name}>
                    <td>
                      <b>{model.name}</b>
                    </td>
                    <td>{model.type}</td>
                    <td>{(2.7 + (i % 7) * 0.31).toFixed(1)}%</td>
                    <td>{(3.8 + (i % 6) * 0.37).toFixed(1)}</td>
                    <td>{(5.2 + (i % 8) * 0.39).toFixed(1)}</td>
                    <td>{(0.31 + (i % 7) * 0.045).toFixed(2)}</td>
                    <td>
                      <Trend value={1.8 + (i % 8) * 0.65} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="context-link">
        <span>
          Usa las señales de <b>{selectedTicker}</b> dentro de una asignación diversificada.
        </span>
        <Link className="button primary" to="/optimizador">
          Ir al Optimizador <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
