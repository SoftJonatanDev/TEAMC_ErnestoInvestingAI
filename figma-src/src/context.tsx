import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ASSETS, PORTFOLIOS, type Profile } from "./data/demo";

type Position = { ticker: string; quantity: number; average: number };
type Trade = {
  id: number;
  ticker: string;
  side: "Compra" | "Venta";
  quantity: number;
  price: number;
  date: string;
};
type Alert = {
  id: number;
  ticker: string;
  kind: "Precio" | "Variación";
  target: number;
  triggered: boolean;
};

type AppState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  watchlist: string[];
  toggleWatchlist: (ticker: string) => void;
  cash: number;
  positions: Position[];
  trades: Trade[];
  trade: (ticker: string, side: "Compra" | "Venta", quantity: number) => string | null;
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, "id" | "triggered">) => void;
  removeAlert: (id: number) => void;
  selectedProfile: Profile;
  setSelectedProfile: (profile: Profile) => void;
  loadPortfolioToTrading: (profile: Profile) => void;
};

const Context = createContext<AppState | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => read("ernesto-theme", "light"));
  const [selectedTicker, setSelectedTicker] = useState(() => {
    const saved = read("ernesto-selected", "SPY");
    return ASSETS.some((asset) => asset.ticker === saved) ? saved : "SPY";
  });
  const [watchlist, setWatchlist] = useState<string[]>(() =>
    read<string[]>("ernesto-watchlist", ["SPY", "QQQ", "EPU", "NVDA"]).filter((ticker) =>
      ASSETS.some((asset) => asset.ticker === ticker),
    ),
  );
  const [cash, setCash] = useState(() => read("ernesto-cash", 25000));
  const [positions, setPositions] = useState<Position[]>(() =>
    read<Position[]>("ernesto-positions", [
      { ticker: "SPY", quantity: 12, average: 572.4 },
      { ticker: "EPU", quantity: 40, average: 39.8 },
    ]).filter((position) => ASSETS.some((asset) => asset.ticker === position.ticker)),
  );
  const [trades, setTrades] = useState<Trade[]>(() => read("ernesto-trades", []));
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    read("ernesto-alerts", [
      { id: 1, ticker: "QQQ", kind: "Precio", target: 510, triggered: false },
      { id: 2, ticker: "EPU", kind: "Variación", target: -0.4, triggered: true },
    ]),
  );
  const [selectedProfile, setSelectedProfile] = useState<Profile>(() =>
    read("ernesto-profile", "Moderado"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ernesto-theme", JSON.stringify(theme));
  }, [theme]);
  useEffect(
    () => localStorage.setItem("ernesto-selected", JSON.stringify(selectedTicker)),
    [selectedTicker],
  );
  useEffect(
    () => localStorage.setItem("ernesto-watchlist", JSON.stringify(watchlist)),
    [watchlist],
  );
  useEffect(() => localStorage.setItem("ernesto-cash", JSON.stringify(cash)), [cash]);
  useEffect(
    () => localStorage.setItem("ernesto-positions", JSON.stringify(positions)),
    [positions],
  );
  useEffect(() => localStorage.setItem("ernesto-trades", JSON.stringify(trades)), [trades]);
  useEffect(() => localStorage.setItem("ernesto-alerts", JSON.stringify(alerts)), [alerts]);
  useEffect(
    () => localStorage.setItem("ernesto-profile", JSON.stringify(selectedProfile)),
    [selectedProfile],
  );

  const trade = (ticker: string, side: "Compra" | "Venta", quantity: number) => {
    const asset = ASSETS.find((item) => item.ticker === ticker)!;
    if (!Number.isInteger(quantity) || quantity <= 0)
      return "Ingresa una cantidad entera mayor que cero.";
    const existing = positions.find((item) => item.ticker === ticker);
    if (side === "Compra" && quantity * asset.price > cash)
      return "El efectivo disponible no cubre esta compra.";
    if (side === "Venta" && (!existing || existing.quantity < quantity))
      return "No tienes posiciones suficientes para esta venta.";

    setCash((value) =>
      side === "Compra" ? value - quantity * asset.price : value + quantity * asset.price,
    );
    setPositions((current) => {
      if (side === "Compra") {
        if (!existing) return [...current, { ticker, quantity, average: asset.price }];
        const total = existing.quantity + quantity;
        return current.map((item) =>
          item.ticker === ticker
            ? {
                ...item,
                quantity: total,
                average: (item.average * item.quantity + asset.price * quantity) / total,
              }
            : item,
        );
      }
      return current
        .map((item) =>
          item.ticker === ticker ? { ...item, quantity: item.quantity - quantity } : item,
        )
        .filter((item) => item.quantity > 0);
    });
    setTrades((current) => [
      {
        id: Date.now(),
        ticker,
        side,
        quantity,
        price: asset.price,
        date: new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(
          new Date(),
        ),
      },
      ...current,
    ]);
    return null;
  };

  const value = useMemo<AppState>(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light")),
      selectedTicker,
      setSelectedTicker,
      watchlist,
      toggleWatchlist: (ticker) =>
        setWatchlist((current) =>
          current.includes(ticker)
            ? current.filter((item) => item !== ticker)
            : [...current, ticker],
        ),
      cash,
      positions,
      trades,
      trade,
      alerts,
      addAlert: (alert) =>
        setAlerts((current) => [{ ...alert, id: Date.now(), triggered: false }, ...current]),
      removeAlert: (id) => setAlerts((current) => current.filter((alert) => alert.id !== id)),
      selectedProfile,
      setSelectedProfile,
      loadPortfolioToTrading: (profile) => {
        setSelectedProfile(profile);
        setSelectedTicker(PORTFOLIOS[profile].assets[0].ticker);
      },
    }),
    [theme, selectedTicker, watchlist, cash, positions, trades, alerts, selectedProfile],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useApp = () => {
  const value = useContext(Context);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
};
