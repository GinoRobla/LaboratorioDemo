import { useEffect, useState } from "react";
import CatalogoView from "./CatalogoView.jsx";
import HistorialView from "./HistorialView.jsx";
import { api } from "./api.js";

const LogoMark = () => (
  <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="url(#g)" />
    <path
      d="M40 20h20v22l16 30a8 8 0 01-7 12H31a8 8 0 01-7-12l16-30V20z"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    <line x1="35" y1="55" x2="65" y2="55" stroke="white" strokeWidth="6" />
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1b7a80" />
        <stop offset="1" stopColor="#0f4c50" />
      </linearGradient>
    </defs>
  </svg>
);

export default function App() {
  const [tab, setTab] = useState("catalogo");
  const [stats, setStats] = useState({ estudios: null, procesadas: null, total: null });

  useEffect(() => {
    Promise.all([api.getCatalogo(), api.getHistorial()])
      .then(([catalogo, historial]) => {
        const totalFacturado = historial.reduce((sum, h) => sum + Number(h.total || 0), 0);
        setStats({ estudios: catalogo.length, procesadas: historial.length, total: totalFacturado });
      })
      .catch(() => setStats({ estudios: "—", procesadas: "—", total: "—" }));
  }, [tab]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <LogoMark />
          <div className="brand-text">
            <span className="brand-name">NovaLab</span>
            <span className="brand-sub">Panel de gestión</span>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === "catalogo" ? "tab active" : "tab"} onClick={() => setTab("catalogo")}>
            Catálogo
          </button>
          <button className={tab === "historial" ? "tab active" : "tab"} onClick={() => setTab("historial")}>
            Historial
          </button>
        </nav>
      </header>

      <main className="content">
        <div className="stats-row">
          <StatCard label="Estudios en catálogo" value={stats.estudios} accent="teal" />
          <StatCard label="Recetas procesadas" value={stats.procesadas} accent="indigo" />
          <StatCard
            label="Total presupuestado"
            value={stats.total === null || stats.total === "—" ? stats.total : `$${Number(stats.total).toLocaleString("es-AR")}`}
            accent="amber"
          />
        </div>

        <div className="panel">{tab === "catalogo" ? <CatalogoView /> : <HistorialView />}</div>
      </main>

      <footer className="footer">NovaLab · Presupuestos automáticos de laboratorio por WhatsApp</footer>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span className="stat-value">{value === null ? "···" : value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
