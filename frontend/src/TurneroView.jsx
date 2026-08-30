import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconChevronLeft, IconChevronRight, IconCalendar } from "./icons.jsx";

const ESTADO_BADGE = {
  Confirmado: "bg-emerald-100 text-emerald-800",
  Pendiente: "bg-amber-100 text-amber-800",
  Cancelado: "bg-slate-100 text-slate-600",
};

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TurneroView() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    const fetchData = () => {
      api.getTurnos()
        .then((data) => setTurnos(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };
    
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    
    return () => clearInterval(interval);
  }, []);

  const turnosDelDia = useMemo(
    () =>
      turnos
        .filter((t) => t.fechaHora && t.estado !== 'Cancelado' && sameDay(new Date(t.fechaHora), selectedDate))
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)),
    [turnos, selectedDate]
  );

  function shiftDay(delta) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  return (
    <section>
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" onClick={() => shiftDay(-1)}>
            <IconChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-slate-800 capitalize min-w-[200px] text-center">
            {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" onClick={() => shiftDay(1)}>
            <IconChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue-500"
            value={toInputDate(selectedDate)}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
            }}
          />
          <button className="text-sm font-medium text-medical-blue-600 hover:text-medical-blue-800 px-2 py-1.5" onClick={goToday}>
            Ir a hoy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Cargando turnos…</div>
      ) : turnosDelDia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 text-slate-400">
            <IconCalendar className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-medium">No hay turnos agendados para este día.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turnosDelDia.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-6">
                <div className="text-xl font-semibold text-slate-900 min-w-[70px]">
                  {new Date(t.fechaHora).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </div>
                <div>
                  <div className="font-medium text-slate-800">{t.estudios}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {t.paciente}
                    {t.telefono ? ` • ${t.telefono}` : ""}
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[t.estado] || ESTADO_BADGE.Pendiente}`}>
                {t.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
