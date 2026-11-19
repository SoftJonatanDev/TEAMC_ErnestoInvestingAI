export const ASSET_GROUPS = [
  "Magníficas 7",
  "Mineras con operaciones en Perú",
  "ETF sectoriales",
  "ETF globales y Perú",
] as const;

export type AssetGroup = (typeof ASSET_GROUPS)[number];

export type Asset = {
  ticker: string;
  name: string;
  group: AssetGroup;
  price: number;
  change: number;
};

// Este contrato coincide con la forma esperada del JSON de universo. Mientras no se
// adjunte ese archivo, precio y variación siguen identificados como datos DEMO.
export const ASSETS: Asset[] = [
  { ticker: "AAPL", name: "Apple", group: "Magníficas 7", price: 227.16, change: 1.24 },
  { ticker: "MSFT", name: "Microsoft", group: "Magníficas 7", price: 415.32, change: -0.42 },
  { ticker: "GOOGL", name: "Alphabet", group: "Magníficas 7", price: 175.98, change: 0.87 },
  { ticker: "AMZN", name: "Amazon", group: "Magníficas 7", price: 201.44, change: 1.71 },
  { ticker: "NVDA", name: "NVIDIA", group: "Magníficas 7", price: 138.85, change: 2.36 },
  { ticker: "META", name: "Meta Platforms", group: "Magníficas 7", price: 567.16, change: -0.64 },
  { ticker: "TSLA", name: "Tesla", group: "Magníficas 7", price: 352.56, change: -2.18 },
  { ticker: "BVN", name: "Compañía de Minas Buenaventura", group: "Mineras con operaciones en Perú", price: 14.72, change: 0.61 },
  { ticker: "FSM", name: "Fortuna Mining", group: "Mineras con operaciones en Perú", price: 4.68, change: -0.43 },
  { ticker: "SCCO", name: "Southern Copper", group: "Mineras con operaciones en Perú", price: 103.62, change: 1.08 },
  { ticker: "BHP", name: "BHP Group", group: "Mineras con operaciones en Perú", price: 52.21, change: 0.44 },
  { ticker: "B", name: "Barrick Mining", group: "Mineras con operaciones en Perú", price: 18.95, change: -0.27 },
  { ticker: "XLK", name: "Technology Select Sector", group: "ETF sectoriales", price: 231.34, change: 1.42 },
  { ticker: "XLF", name: "Financial Select Sector", group: "ETF sectoriales", price: 49.03, change: 0.39 },
  { ticker: "XLE", name: "Energy Select Sector", group: "ETF sectoriales", price: 91.17, change: -0.58 },
  { ticker: "XLV", name: "Health Care Select Sector", group: "ETF sectoriales", price: 146.65, change: 0.33 },
  { ticker: "XLY", name: "Consumer Discretionary", group: "ETF sectoriales", price: 219.78, change: 0.96 },
  { ticker: "XLP", name: "Consumer Staples", group: "ETF sectoriales", price: 81.02, change: -0.14 },
  { ticker: "XLI", name: "Industrial Select Sector", group: "ETF sectoriales", price: 138.45, change: 0.51 },
  { ticker: "XLU", name: "Utilities Select Sector", group: "ETF sectoriales", price: 79.41, change: 0.18 },
  { ticker: "XLB", name: "Materials Select Sector", group: "ETF sectoriales", price: 92.12, change: 0.25 },
  { ticker: "XLRE", name: "Real Estate Select Sector", group: "ETF sectoriales", price: 42.08, change: -0.37 },
  { ticker: "XLC", name: "Communication Services", group: "ETF sectoriales", price: 97.88, change: 0.72 },
  { ticker: "SPY", name: "S&P 500 ETF", group: "ETF globales y Perú", price: 590.83, change: 0.78 },
  { ticker: "QQQ", name: "Nasdaq 100 ETF", group: "ETF globales y Perú", price: 505.58, change: 1.09 },
  { ticker: "EPU", name: "iShares MSCI Peru ETF", group: "ETF globales y Perú", price: 41.27, change: -0.46 },
];

export const ML_MODELS = [
  "Regresión logística", "SVC RBF", "K vecinos", "Naive Bayes", "Árbol de decisión",
  "Random Forest", "Extra Trees", "AdaBoost", "Gradient Boosting", "XGBoost", "LightGBM",
] as const;
export const DL_MODELS = ["MLP", "RNN", "LSTM", "GRU", "BiLSTM", "CNN 1D", "Transformer"] as const;
export const MODELS = [...ML_MODELS, ...DL_MODELS] as const;
export type ClassificationModel = (typeof MODELS)[number];

export const REGRESSION_ML_MODELS = [
  "Lineal", "Ridge", "Lasso", "Elastic Net", "SVR", "K vecinos", "Árbol",
  "Random Forest", "Gradient Boosting", "XGBoost", "LightGBM",
] as const;
export const REGRESSION_DL_MODELS = ["MLP", "RNN", "LSTM", "GRU", "BiLSTM", "CNN 1D", "Transformer"] as const;
export const REGRESSION_MODELS = [...REGRESSION_ML_MODELS, ...REGRESSION_DL_MODELS] as const;

export type ClassificationMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  confusion: { tn: number; fp: number; fn: number; tp: number };
};

export const modelProbability = (modelIndex: number, assetIndex: number) => {
  const wave = Math.sin((modelIndex + 1) * 1.83 + assetIndex * 0.71);
  return Math.round((0.5 + wave * 0.115) * 100);
};

export const classificationMetricsFor = (
  modelIndex: number,
  assetIndex: number,
): ClassificationMetrics => {
  const tn = 118 + ((modelIndex * 17 + assetIndex * 7) % 43);
  const fp = 82 + ((modelIndex * 11 + assetIndex * 5) % 38);
  const fn = 79 + ((modelIndex * 13 + assetIndex * 3) % 35);
  const tp = 124 + ((modelIndex * 19 + assetIndex * 11) % 47);
  const accuracy = ((tn + tp) / (tn + fp + fn + tp)) * 100;
  const precision = (tp / (tp + fp)) * 100;
  const recall = (tp / (tp + fn)) * 100;
  return {
    accuracy,
    precision,
    recall,
    f1: (2 * precision * recall) / (precision + recall),
    auc: 52 + ((modelIndex * 7 + assetIndex * 3) % 12) + 0.2,
    confusion: { tn, fp, fn, tp },
  };
};

export const historyFor = (asset: Asset, count = 120) =>
  Array.from({ length: count }, (_, i) => {
    const trend = (i - count) * asset.price * 0.00035;
    const wave = Math.sin(i * 0.31 + asset.price) * asset.price * 0.018;
    const close = asset.price + trend + wave;
    const open = close * (1 + Math.sin(i * 1.7) * 0.006);
    return { i, open, close, high: Math.max(open, close) * 1.008, low: Math.min(open, close) * 0.992 };
  });

export type Profile = "Conservador" | "Moderado" | "Agresivo";
export type PortfolioAsset = {
  ticker: string;
  weight: number;
  group: AssetGroup;
  inclusionReason: string;
};
export type PortfolioRecord = {
  expectedReturn: number;
  volatility: number;
  sharpe: number;
  cvar95: number;
  color: string;
  assets: PortfolioAsset[];
};

// Adaptador de fallback con la misma forma del archivo de portafolios.
export const PORTFOLIOS: Record<Profile, PortfolioRecord> = {
  Conservador: {
    expectedReturn: 7.8, volatility: 9.4, sharpe: 0.62, cvar95: -3.8, color: "#0B4F9C",
    assets: [
      { ticker: "SPY", weight: 35, group: "ETF globales y Perú", inclusionReason: "Diversificación amplia y menor dispersión." },
      { ticker: "XLV", weight: 25, group: "ETF sectoriales", inclusionReason: "Señal estable en clasificación." },
      { ticker: "XLP", weight: 20, group: "ETF sectoriales", inclusionReason: "Regresión con banda de riesgo acotada." },
      { ticker: "XLU", weight: 20, group: "ETF sectoriales", inclusionReason: "Perfil defensivo ante volatilidad." },
    ],
  },
  Moderado: {
    expectedReturn: 11.9, volatility: 14.7, sharpe: 0.71, cvar95: -6.2, color: "#6D5BD0",
    assets: [
      { ticker: "SPY", weight: 30, group: "ETF globales y Perú", inclusionReason: "Núcleo diversificado del portafolio." },
      { ticker: "QQQ", weight: 25, group: "ETF globales y Perú", inclusionReason: "Consenso favorable de modelos." },
      { ticker: "AAPL", weight: 20, group: "Magníficas 7", inclusionReason: "Balance entre señal y riesgo." },
      { ticker: "XLF", weight: 15, group: "ETF sectoriales", inclusionReason: "Diversificación sectorial." },
      { ticker: "EPU", weight: 10, group: "ETF globales y Perú", inclusionReason: "Exposición táctica a Perú." },
    ],
  },
  Agresivo: {
    expectedReturn: 18.6, volatility: 24.8, sharpe: 0.67, cvar95: -11.4, color: "#C06A17",
    assets: [
      { ticker: "NVDA", weight: 30, group: "Magníficas 7", inclusionReason: "Mayor retorno proyectado del conjunto." },
      { ticker: "TSLA", weight: 20, group: "Magníficas 7", inclusionReason: "Alta convicción con volatilidad elevada." },
      { ticker: "QQQ", weight: 20, group: "ETF globales y Perú", inclusionReason: "Exposición tecnológica diversificada." },
      { ticker: "SCCO", weight: 15, group: "Mineras con operaciones en Perú", inclusionReason: "Señal positiva no correlacionada." },
      { ticker: "XLK", weight: 15, group: "ETF sectoriales", inclusionReason: "Refuerzo de tendencia tecnológica." },
    ],
  },
};

export type OptimizerMethod = "Markowitz" | "NSGA-II" | "NSGA-III";
export type FrontierPoint = {
  id: string;
  method: OptimizerMethod;
  universe: "Completo" | "Elegibles";
  volatility: number;
  expectedReturn: number;
  sharpe: number;
  cvar95: number;
  weights: { ticker: string; weight: number }[];
};

const optimizerWeights = [
  [{ ticker: "SPY", weight: 42 }, { ticker: "XLV", weight: 23 }, { ticker: "XLP", weight: 19 }, { ticker: "EPU", weight: 16 }],
  [{ ticker: "SPY", weight: 34 }, { ticker: "QQQ", weight: 24 }, { ticker: "AAPL", weight: 18 }, { ticker: "XLV", weight: 14 }, { ticker: "EPU", weight: 10 }],
  [{ ticker: "QQQ", weight: 29 }, { ticker: "NVDA", weight: 24 }, { ticker: "SPY", weight: 21 }, { ticker: "SCCO", weight: 14 }, { ticker: "EPU", weight: 12 }],
];

const frontier = (
  method: OptimizerMethod,
  universe: "Completo" | "Elegibles",
  rows: [number, number, number, number][],
): FrontierPoint[] =>
  rows.map(([volatility, expectedReturn, sharpe, cvar95], index) => ({
    id: `${method}-${universe}-${index}`,
    method, universe, volatility, expectedReturn, sharpe, cvar95,
    weights: optimizerWeights[Math.min(index, 2)],
  }));

export const OPTIMIZER_POINTS: FrontierPoint[] = [
  ...frontier("Markowitz", "Completo", [[7.1, 6.2, 0.62, -3.4], [10.2, 9.1, 0.70, -4.8], [14.5, 12.4, 0.72, -6.9], [19.1, 15.0, 0.68, -9.5], [23.4, 16.7, 0.63, -12.1]]),
  ...frontier("Markowitz", "Elegibles", [[7.8, 6.6, 0.61, -3.8], [11.4, 9.8, 0.69, -5.3], [15.2, 12.9, 0.71, -7.3], [19.8, 15.5, 0.67, -9.9], [22.7, 16.5, 0.62, -11.8]]),
  ...frontier("NSGA-II", "Completo", [[8.0, 7.0, 0.64, -3.9], [11.7, 10.5, 0.73, -5.4], [15.6, 13.8, 0.75, -7.1], [19.3, 16.1, 0.72, -9.2], [22.5, 17.5, 0.68, -11.4]]),
  ...frontier("NSGA-II", "Elegibles", [[8.5, 7.2, 0.62, -4.1], [12.1, 10.7, 0.71, -5.7], [16.0, 13.9, 0.73, -7.5], [19.6, 15.9, 0.69, -9.5], [22.1, 17.0, 0.65, -11.1]]),
  ...frontier("NSGA-III", "Completo", [[8.7, 7.4, 0.65, -3.6], [12.4, 10.9, 0.72, -4.9], [14.6, 13.1, 0.76, -6.8], [18.2, 15.5, 0.73, -8.5], [21.4, 17.1, 0.69, -10.4]]),
  ...frontier("NSGA-III", "Elegibles", [[9.1, 7.6, 0.63, -3.9], [12.8, 11.0, 0.70, -5.2], [15.1, 13.2, 0.73, -7.0], [18.6, 15.4, 0.70, -8.8], [21.0, 16.7, 0.67, -10.2]]),
];
