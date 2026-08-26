import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconCheck, IconAlert, IconClipboard } from "./icons.jsx";
import Pagination from "./Pagination.jsx";

const PAGE_SIZE = 10;

export default function HistorialView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .getHistorial()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Cargando historial…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconClipboard />
          </div>
          <p>Todavía no se procesó ninguna receta.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Estudios reconocidos</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td className="muted">{item.fecha}</td>
                  <td>{item.paciente || "—"}</td>
                  <td>{item.estudiosMatcheados || "—"}</td>
                  <td>
                    {item.noReconocidos ? (
                      <span className="badge badge-warn">
                        <IconAlert />
                        {item.noReconocidos}
                      </span>
                    ) : (
                      <span className="badge badge-ok">
                        <IconCheck />
                        Completo
                      </span>
                    )}
                  </td>
                  <td className="price-cell">${Number(item.total).toLocaleString("es-AR")}</td>
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
