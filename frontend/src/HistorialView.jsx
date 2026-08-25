import { useEffect, useState } from "react";
import { api } from "./api.js";

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
      <h2>Historial de recetas procesadas</h2>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Paciente</th>
              <th>Estudios reconocidos</th>
              <th>No reconocidos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.fecha}</td>
                <td>{item.paciente}</td>
                <td>{item.estudiosMatcheados}</td>
                <td className={item.noReconocidos ? "warn" : "muted"}>
                  {item.noReconocidos || "—"}
                </td>
                <td>${Number(item.total).toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Todavía no se procesó ninguna receta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
