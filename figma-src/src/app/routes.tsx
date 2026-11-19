import { createBrowserRouter } from "react-router";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import Watchlist from "../pages/Watchlist";
import Trading from "../pages/Trading";
import Leaderboard from "../pages/Leaderboard";
import Classification from "../pages/Classification";
import Regression from "../pages/Regression";
import Optimizer from "../pages/Optimizer";
import Portfolios from "../pages/Portfolios";
import Backtesting from "../pages/Backtesting";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "watchlist", Component: Watchlist },
      { path: "trading", Component: Trading },
      { path: "leaderboard", Component: Leaderboard },
      { path: "clasificacion", Component: Classification },
      { path: "regresion", Component: Regression },
      { path: "optimizador", Component: Optimizer },
      { path: "portafolios", Component: Portfolios },
      { path: "backtesting", Component: Backtesting },
      { path: "*", Component: Dashboard },
    ],
  },
]);
