import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BrainCircuit,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Moon,
  PieChart,
  Sun,
  Trophy,
  WalletCards,
  X,
} from "lucide-react";
import { useApp } from "../context";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/watchlist", label: "Watchlist", icon: BellRing },
  { to: "/trading", label: "Trading", icon: ChartNoAxesCombined },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/clasificacion", label: "Clasificación", icon: BrainCircuit },
  { to: "/regresion", label: "Regresión", icon: BarChart3 },
  { to: "/optimizador", label: "Optimizador", icon: FlaskConical },
  { to: "/portafolios", label: "Portafolios", icon: PieChart },
  { to: "/backtesting", label: "Backtesting", icon: Activity },
];

export default function Layout() {
  const { theme, toggleTheme, cash } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="icon-button menu-button"
          onClick={() => setOpen(true)}
          aria-label="Abrir navegación"
        >
          <Menu size={21} />
        </button>
        <NavLink to="/" className="brand" aria-label="Ernesto Investing AI, inicio">
          <span className="brand-mark">
            <Activity size={19} />
          </span>
          <span>
            Ernesto <b>Investing AI</b>
          </span>
        </NavLink>
        <div className="topbar-meta">
          <span className="demo-pill">DEMO académico</span>
          <span className="cash">
            <WalletCards size={16} /> <span>Efectivo</span>{" "}
            <strong>US$ {cash.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
          </span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Activar tema oscuro" : "Activar tema claro"}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            <span>{theme === "light" ? "Oscuro" : "Claro"}</span>
          </button>
        </div>
      </header>

      <div className={`nav-scrim ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Navegación principal">
        <div className="mobile-nav-head">
          <span>Menú principal</span>
          <button
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar navegación"
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <BriefcaseBusiness size={17} />
          <div>
            <strong>Simulación activa</strong>
            <span>Sin dinero real</span>
          </div>
        </div>
      </aside>

      <main id="main-content" className="main-content">
        <Outlet />
      </main>

      <nav className="mobile-bottom" aria-label="Navegación móvil">
        {nav.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)}>
          <Menu size={19} />
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
