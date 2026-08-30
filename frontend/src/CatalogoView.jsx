import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconPlus, IconEdit, IconTrash, IconFlask } from "./icons.jsx";
import Modal from "./Modal.jsx";
import Pagination from "./Pagination.jsx";

const EMPTY = { nombre: "", codigo: "", precio: "", sinonimos: "" };
const PAGE_SIZE = 10;

export default function CatalogoView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

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
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}

      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-slate-500 font-medium">
          {items.length} estudio{items.length === 1 ? "" : "s"} cargado{items.length === 1 ? "" : "s"}
        </span>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 bg-medical-blue-600 hover:bg-medical-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <IconPlus className="w-4 h-4" />
          Agregar estudio
        </button>
      </div>

      {formOpen && (
        <Modal title={editingId ? "Editar estudio" : "Nuevo estudio"} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 block">
                <span className="text-sm font-medium text-slate-700 mb-1 block">Nombre</span>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent"
                  placeholder="Ej: Hemograma"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 mb-1 block">Código</span>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent"
                  placeholder="Ej: HEM01"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 mb-1 block">Precio ($)</span>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </label>
              <label className="col-span-2 block">
                <span className="text-sm font-medium text-slate-700 mb-1 block">Sinónimos (separados por coma)</span>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent"
                  placeholder="Ej: Hemograma completo, Hemogrma"
                  value={form.sinonimos}
                  onChange={(e) => setForm({ ...form, sinonimos: e.target.value })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" 
                onClick={closeForm}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-medical-blue-600 hover:bg-medical-blue-900 rounded-lg transition-colors shadow-sm"
              >
                {editingId ? "Guardar cambios" : "Agregar estudio"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Cargando catálogo…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 text-slate-400">
            <IconFlask className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-medium">Todavía no hay estudios cargados.</p>
          <p className="text-sm text-slate-500 mt-1">Agregá el primero usando el botón de arriba.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Sinónimos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pageItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{item.codigo || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">${Number(item.precio).toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]" title={item.sinonimos}>{item.sinonimos || "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-medical-blue-600 transition-colors text-xs font-medium px-2 py-1"
                      onClick={() => startEdit(item)}
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button 
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors text-xs font-medium px-2 py-1"
                      onClick={() => handleDelete(item.id)}
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </td>
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
