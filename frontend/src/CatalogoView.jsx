import { useEffect, useState } from "react";
import { api } from "./api.js";

const EMPTY = { nombre: "", codigo: "", precio: "", sinonimos: "" };

export default function CatalogoView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await api.getCatalogo());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateEstudio(editingId, form);
      } else {
        await api.createEstudio(form);
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, codigo: item.codigo, precio: item.precio, sinonimos: item.sinonimos });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este estudio del catálogo?")) return;
    setError("");
    try {
      await api.deleteEstudio(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Catálogo de estudios</h2>
      {error && <p className="error">{error}</p>}

      <form className="form-row" onSubmit={handleSubmit}>
        <input
          placeholder="Nombre del estudio"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          placeholder="Código"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />
        <input
          placeholder="Precio"
          type="number"
          step="0.01"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          required
        />
        <input
          placeholder="Sinónimos (separados por coma)"
          value={form.sinonimos}
          onChange={(e) => setForm({ ...form, sinonimos: e.target.value })}
        />
        <button type="submit">{editingId ? "Guardar" : "Agregar"}</button>
        {editingId && (
          <button type="button" className="secondary" onClick={cancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Precio</th>
              <th>Sinónimos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>{item.codigo}</td>
                <td>${Number(item.precio).toLocaleString("es-AR")}</td>
                <td className="muted">{item.sinonimos}</td>
                <td className="actions">
                  <button onClick={() => startEdit(item)}>Editar</button>
                  <button className="danger" onClick={() => handleDelete(item.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Todavía no hay estudios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
