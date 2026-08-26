import { useEffect, useState } from "react";
import { api } from "./api.js";
import { IconPlus, IconEdit, IconTrash, IconFlask } from "./icons.jsx";

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
        <button type="submit">
          {!editingId && <IconPlus />}
          {editingId ? "Guardar cambios" : "Agregar estudio"}
        </button>
        {editingId && (
          <button type="button" className="secondary" onClick={cancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <p className="muted">Cargando catálogo…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconFlask />
          </div>
          <p>Todavía no hay estudios cargados. Agregá el primero arriba.</p>
        </div>
      ) : (
        <div className="table-wrap">
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
                  <td className="muted">{item.codigo || "—"}</td>
                  <td className="price-cell">${Number(item.precio).toLocaleString("es-AR")}</td>
                  <td className="muted">{item.sinonimos || "—"}</td>
                  <td className="actions">
                    <button className="ghost-small" onClick={() => startEdit(item)}>
                      <IconEdit />
                      Editar
                    </button>
                    <button className="danger" onClick={() => handleDelete(item.id)}>
                      <IconTrash />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
