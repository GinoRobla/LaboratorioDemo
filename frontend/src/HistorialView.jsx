import { useEffect, useState } from "react";
import { api } from "./api.js";
import { IconCheck, IconAlert, IconClipboard } from "./icons.jsx";

export default function HistorialView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getHistorial()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
              {items.map((item) => (
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
    </section>
  );
}
