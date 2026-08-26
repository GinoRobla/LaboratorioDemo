import { useEffect, useState } from "react";
import { api } from "./api.js";
import { IconPlus, IconEdit, IconTrash, IconFlask, IconClose } from "./icons.jsx";

const EMPTY = { nombre: "", codigo: "", precio: "", sinonimos: "" };

export default function CatalogoView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

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
      closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, codigo: item.codigo, precio: item.precio, sinonimos: item.sinonimos });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
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

      <div className="section-toolbar">
        <span className="muted">{items.length} estudio{items.length === 1 ? "" : "s"} cargado{items.length === 1 ? "" : "s"}</span>
        {!formOpen && (
          <button onClick={openNew}>
            <IconPlus />
            Agregar estudio
          </button>
        )}
      </div>

      {formOpen && (
        <form className="inline-card-form" onSubmit={handleSubmit}>
          <div className="inline-card-form-header">
            <span>{editingId ? "Editar estudio" : "Nuevo estudio"}</span>
            <button type="button" className="icon-only ghost-small" onClick={closeForm}>
              <IconClose />
            </button>
          </div>
          <div className="form-grid">
            <label>
              Nombre
              <input
                placeholder="Ej: Hemograma"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                autoFocus
              />
            </label>
            <label>
              Código
              <input
                placeholder="Ej: HEM01"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </label>
            <label>
              Precio
              <input
                placeholder="0.00"
                type="number"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                required
              />
            </label>
            <label className="span-2">
              Sinónimos (para que el bot lo reconozca aunque venga mal escrito)
              <input
                placeholder="Ej: Hemograma completo, Hemogrma"
                value={form.sinonimos}
                onChange={(e) => setForm({ ...form, sinonimos: e.target.value })}
              />
            </label>
          </div>
          <div className="inline-card-form-actions">
            <button type="button" className="secondary" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit">{editingId ? "Guardar cambios" : "Agregar estudio"}</button>
          </div>
        </form>
      )}

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
