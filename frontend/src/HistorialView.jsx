import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconCheck, IconAlert, IconClipboard } from "./icons.jsx";
import Pagination from "./Pagination.jsx";

const PAGE_SIZE = 10;

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default function HistorialView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = () => {
      api
        .getHistorial()
        .then(setItems)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <section>
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Cargando historial…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 text-slate-400">
            <IconClipboard className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-medium">Todavía no se procesó ninguna receta.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Estudios reconocidos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pageItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{formatFecha(item.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.paciente || "—"}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={item.estudiosMatcheados}>{item.estudiosMatcheados || "—"}</td>
                  <td className="px-4 py-3">
                    {item.noReconocidos ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800" title={`No reconocidos: ${item.noReconocidos}`}>
                        <IconAlert className="w-3.5 h-3.5" />
                        Incompleto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <IconCheck className="w-3.5 h-3.5" />
                        Completo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">${Number(item.total).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
