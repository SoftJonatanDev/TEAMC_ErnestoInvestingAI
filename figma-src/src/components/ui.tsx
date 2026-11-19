import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { ASSETS } from "../data/demo";
import { useApp } from "../context";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  );
}

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning";
}) {
  return (
    <div className={`notice notice--${tone}`} role="note">
      <Info size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function AssetSelect({ id = "asset-select" }: { id?: string }) {
  const { selectedTicker, setSelectedTicker } = useApp();
  return (
    <select
      id={id}
      value={selectedTicker}
      onChange={(event) => setSelectedTicker(event.target.value)}
    >
      {ASSETS.map((asset) => (
        <option key={asset.ticker} value={asset.ticker}>
          {asset.ticker} · {asset.name}
        </option>
      ))}
    </select>
  );
}

export function Trend({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={`trend ${up ? "trend--up" : "trend--down"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      {up ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function SimpleLineChart({
  series,
  labels,
  height = 250,
  ariaLabel,
  bands,
}: {
  series: { name: string; values: number[]; color: string; dashed?: boolean }[];
  labels?: string[];
  height?: number;
  ariaLabel: string;
  bands?: { low: number[]; high: number[]; color: string };
}) {
  const all = [
    ...series.flatMap((item) => item.values),
    ...(bands ? [...bands.low, ...bands.high] : []),
  ].filter(Number.isFinite);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const width = 900;
  const pad = 36;
  const x = (i: number, length: number) => pad + i * ((width - pad * 2) / Math.max(1, length - 1));
  const y = (value: number) =>
    height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2);
  const path = (values: number[]) => {
    let drawing = false;
    return values
      .map((value, i) => {
        if (!Number.isFinite(value)) {
          drawing = false;
          return "";
        }
        const command = drawing ? "L" : "M";
        drawing = true;
        return `${command} ${x(i, values.length)} ${y(value)}`;
      })
      .join(" ");
  };
  const bandPath = bands
    ? [
        ...bands.high.map((value, i) => `${i ? "L" : "M"} ${x(i, bands.high.length)} ${y(value)}`),
        ...bands.low.map(
          (value, i) =>
            `L ${x(bands.low.length - i - 1, bands.low.length)} ${y(bands.low[bands.low.length - i - 1])}`,
        ),
        "Z",
      ].join(" ")
    : "";

  return (
    <div className="chart-wrap">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const yy = pad + tick * ((height - pad * 2) / 4);
          return (
            <line key={tick} x1={pad} y1={yy} x2={width - pad} y2={yy} className="grid-line" />
          );
        })}
        {bands && <path d={bandPath} fill={bands.color} opacity=".16" />}
        {series.map((item) => (
          <path
            key={item.name}
            d={path(item.values)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={item.dashed ? "8 7" : undefined}
          />
        ))}
        <text x={pad} y={height - 8}>
          {labels?.[0] ?? "Inicio"}
        </text>
        <text x={width - pad} y={height - 8} textAnchor="end">
          {labels?.at(-1) ?? "Actual"}
        </text>
      </svg>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.name}>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
        {bands && (
          <span>
            <i style={{ background: bands.color, opacity: 0.35 }} />
            Banda p10–p90
          </span>
        )}
      </div>
    </div>
  );
}

export function Donut({
  items,
  label,
}: {
  items: { name: string; value: number; color: string }[];
  label: string;
}) {
  let offset = 0;
  return (
    <div className="donut-block">
      <svg viewBox="0 0 120 120" className="donut" role="img" aria-label={label}>
        <circle cx="60" cy="60" r="42" fill="none" className="donut-base" strokeWidth="18" />
        {items.map((item) => {
          const dash = item.value * 2.6389;
          const node = (
            <circle
              key={item.name}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${263.89 - dash}`}
              strokeDashoffset={-offset * 2.6389}
              transform="rotate(-90 60 60)"
            />
          );
          offset += item.value;
          return node;
        })}
        <text x="60" y="58" textAnchor="middle" className="donut-total">
          100%
        </text>
        <text x="60" y="72" textAnchor="middle" className="donut-label">
          asignado
        </text>
      </svg>
    </div>
  );
}
