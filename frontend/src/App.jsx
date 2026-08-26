import { useEffect, useState } from "react";
import CatalogoView from "./CatalogoView.jsx";
import HistorialView from "./HistorialView.jsx";
import TurneroView from "./TurneroView.jsx";
import { api } from "./api.js";
import { IconFlask, IconClipboard, IconGrid, IconInbox, IconWallet, IconCalendar } from "./icons.jsx";

const NAV_ITEMS = [
  { id: "catalogo", label: "Catálogo", icon: IconFlask },
  { id: "turnero", label: "Turnero", icon: IconCalendar },
  { id: "historial", label: "Historial", icon: IconClipboard },
];

const LogoMark = () => (
  <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="url(#g)" />
    <path
      d="M40 22h20v20l16 28a8 8 0 01-7 12H31a8 8 0 01-7-12l16-28V22z"
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

const PAGE_META = {
  catalogo: {
    title: "Catálogo de estudios",
    subtitle: "Estudios, códigos y precios que usa el bot para armar presupuestos.",
  },
  historial: {
    title: "Historial de recetas",
    subtitle: "Cada presupuesto que el bot le generó a un paciente por WhatsApp.",
  },
  turnero: {
    title: "Turnero",
    subtitle: "Turnos agendados por el bot para toma de estudios.",
  },
};

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

  const meta = PAGE_META[tab];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <LogoMark />
          <div className="brand-text">
            <span className="brand-name">NovaLab</span>
            <span className="brand-sub">Panel de gestión</span>
          </div>
        </div>

        <nav className="side-nav">
          <span className="side-nav-label">General</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? "side-link active" : "side-link"} onClick={() => setTab(id)}>
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-dot" />
          <div>
            <div className="sidebar-footer-title">Bot activo</div>
            <div className="sidebar-footer-sub">Presupuestos por WhatsApp</div>
          </div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div>
            <h1 className="page-title">{meta.title}</h1>
            <p className="page-subtitle">{meta.subtitle}</p>
          </div>
        </header>

        <main className="content">
          <div className="stats-row">
            <StatCard icon={IconGrid} label="Estudios en catálogo" value={stats.estudios} accent="teal" />
            <StatCard icon={IconInbox} label="Recetas procesadas" value={stats.procesadas} accent="indigo" />
            <StatCard
              icon={IconWallet}
              label="Total presupuestado"
              value={
                stats.total === null || stats.total === "—" ? stats.total : `$${Number(stats.total).toLocaleString("es-AR")}`
              }
              accent="amber"
            />
          </div>

          <div className="panel">
            {tab === "catalogo" && <CatalogoView />}
            {tab === "historial" && <HistorialView />}
            {tab === "turnero" && <TurneroView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className={`stat-icon accent-${accent}`}>
        <Icon />
      </div>
      <div>
        <span className="stat-value">{value === null ? "···" : value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}
