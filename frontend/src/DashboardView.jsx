import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { api } from "./api.js";
import { IconChartBar, IconCheck, IconAlert } from "./icons.jsx";

export default function DashboardView() {
  const [historial, setHistorial] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHistorial(),
      api.getMetrics()
    ]).then(([hist, met]) => {
      setHistorial(hist);
      setMetrics(met);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!historial.length) return [];
    
    // Group by date
    const grouped = historial.reduce((acc, item) => {
      const date = item.fecha ? item.fecha.split("T")[0] : "Sin fecha";
      if (!acc[date]) {
        acc[date] = { date, completas: 0, incompletas: 0 };
      }
      if (item.noReconocidos) acc[date].incompletas++;
      else acc[date].completas++;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).slice(-7); // Last 7 days
  }, [historial]);

  const topEstudios = useMemo(() => {
    const counts = {};
    historial.forEach((item) => {
      let matcheados = [];
      try {
        matcheados = typeof item.estudiosMatcheados === "string"
          ? JSON.parse(item.estudiosMatcheados)
          : (item.estudiosMatcheados || []);
      } catch (e) {
        // ignore
      }
      
      matcheados.forEach((estudio) => {
        counts[estudio] = (counts[estudio] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [historial]);

  if (loading) return <div className="py-12 text-center text-slate-500">Cargando métricas…</div>;

  return (
    <div className="h-[calc(100vh-64px)] p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      <div className="flex items-center gap-3 flex-shrink-0">
        <IconChartBar className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rendimiento del Bot</h1>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-sm font-medium text-slate-500 mb-1">Consultas Respondidas</span>
            <span className="text-3xl font-bold text-slate-800">{metrics.consultasRespondidas}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-sm font-medium text-slate-500 mb-1">Recetas Cotizadas</span>
            <span className="text-3xl font-bold text-emerald-600">{metrics.recetasCotizadas}</span>
            {metrics.recetasNoEntendidas > 0 && <span className="text-xs text-red-400 mt-1">{metrics.recetasNoEntendidas} ilegibles</span>}
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-sm font-medium text-slate-500 mb-1">Gestión de Turnos</span>
            <span className="text-3xl font-bold text-blue-600">{metrics.turnosAgendados}</span>
            <span className="text-xs text-slate-400 mt-1">{metrics.turnosCancelados} cancelados · {metrics.turnosEditados} reprogramados</span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-sm font-medium text-slate-500 mb-1">Tiempo Humano Ahorrado</span>
            <span className="text-3xl font-bold text-violet-600">{metrics.tiempoAhorrado}</span>
            <span className="text-xs text-slate-400 mt-1">Aprox. 7 min por consulta</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Rendimiento del Bot */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">Presupuestos Cotizados (últimos 7 días)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Bar name="Reconocidas 100%" dataKey="completas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar name="Requirió Operador" dataKey="incompletas" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Estudios */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">Top 5 Estudios Solicitados</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEstudios} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#334155", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
