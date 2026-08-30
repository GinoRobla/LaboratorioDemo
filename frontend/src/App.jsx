import { useEffect, useState } from "react";
import CatalogoView from "./CatalogoView.jsx";
import HistorialView from "./HistorialView.jsx";
import TurneroView from "./TurneroView.jsx";
import DashboardView from "./DashboardView.jsx";
import AuditoriaView from "./AuditoriaView.jsx";
import { api } from "./api.js";
import { IconFlask, IconClipboard, IconGrid, IconInbox, IconWallet, IconCalendar, IconChartBar, IconEye } from "./icons.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: IconChartBar },
  { id: "auditoria", label: "Auditoría OCR", icon: IconEye },
  { id: "catalogo", label: "Catálogo", icon: IconFlask },
  { id: "turnero", label: "Turnero", icon: IconCalendar },
  { id: "historial", label: "Historial", icon: IconClipboard },
];

const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <stop stopColor="#1b80ab" />
        <stop offset="1" stopColor="#0f384a" />
      </linearGradient>
    </defs>
  </svg>
);

const PAGE_META = {
  dashboard: {
    title: "Dashboard de Métricas",
    subtitle: "Rendimiento del asistente virtual y estadísticas de presupuesto.",
  },
  auditoria: {
    title: "Auditoría de OCR",
    subtitle: "Revisión de recetas médicas procesadas por IA.",
  },
  catalogo: {
    title: "Catálogo de estudios",
    subtitle: "Gestión de estudios, códigos y precios para la generación de presupuestos.",
  },
  historial: {
    title: "Historial de recetas",
    subtitle: "Registro de presupuestos generados a pacientes por WhatsApp.",
  },
  turnero: {
    title: "Turnero",
    subtitle: "Turnos agendados para la toma de estudios en el laboratorio.",
  },
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
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
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <LogoMark />
          <div className="ml-3 flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">IBP</span>
            <span className="text-xs text-slate-500 font-medium">Panel de gestión</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
          <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">General</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-medical-blue-50 text-medical-blue-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className="w-5 h-5 opacity-80" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{meta.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={IconGrid} label="Estudios en catálogo" value={stats.estudios} color="teal" />
            <StatCard icon={IconInbox} label="Recetas procesadas" value={stats.procesadas} color="indigo" />
            <StatCard
              icon={IconWallet}
              label="Total presupuestado"
              value={
                stats.total === null || stats.total === "—" ? stats.total : `$${Number(stats.total).toLocaleString("es-AR")}`
              }
              color="amber"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
            {tab === "dashboard" && <DashboardView />}
            {tab === "auditoria" && <AuditoriaView />}
            {tab === "catalogo" && <CatalogoView />}
            {tab === "historial" && <HistorialView />}
            {tab === "turnero" && <TurneroView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    teal: "text-teal-600 bg-teal-50",
    indigo: "text-indigo-600 bg-indigo-50",
    amber: "text-amber-600 bg-amber-50",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value === null ? "···" : value}</div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}
