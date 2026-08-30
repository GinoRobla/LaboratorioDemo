import { useEffect, useState } from "react";
import { api } from "./api.js";
import { IconAlert, IconCheck } from "./icons.jsx";

export default function AuditoriaView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    api
      .getHistorial()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-slate-500">Cargando bandeja…</div>;

  const recetasConImagen = items.filter(item => item.imagenUrl);
  const totalPages = Math.ceil(recetasConImagen.length / itemsPerPage) || 1;
  const currentItems = recetasConImagen.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Bandeja de Auditoría OCR</h2>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
          {recetasConImagen.length} recetas recientes
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {currentItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left: Original Image */}
            <div className="md:w-1/2 bg-slate-100 border-r border-slate-200 p-4 flex flex-col items-center justify-center">
              <a href={item.imagenUrl} target="_blank" rel="noreferrer" className="block w-full">
                <img 
                  src={item.imagenUrl} 
                  alt="Receta médica" 
                  className="w-full h-48 object-contain rounded border border-slate-300 bg-white hover:opacity-90 transition-opacity"
                />
              </a>
              <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Clic para ampliar</span>
            </div>

            {/* Right: OCR Data */}
            <div className="md:w-1/2 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">{item.paciente || "Paciente Anónimo"}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.fecha ? new Date(item.fecha).toLocaleString('es-AR') : ''}</div>
                </div>
                {item.noReconocidos ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                    <IconAlert className="w-3 h-3" /> Revisión Requerida
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    <IconCheck className="w-3 h-3" /> OK
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Detección OCR (IA)</label>
                  <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 min-h-12 max-h-24 overflow-y-auto break-all">
                    {item.textoOcr || "No se detectó texto"}
                  </p>
                </div>
                
                {item.noReconocidos && (
                  <div>
                    <label className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block mb-1">Dudas de la IA</label>
                    <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100 break-all">
                      {item.noReconocidos}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500 font-medium px-4">
            Página {page} de {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
