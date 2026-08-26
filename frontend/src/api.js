const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getCatalogo: () => request("/catalogo"),
  createEstudio: (data) => request("/catalogo", { method: "POST", body: JSON.stringify(data) }),
  updateEstudio: (id, data) => request(`/catalogo/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEstudio: (id) => request(`/catalogo/${id}`, { method: "DELETE" }),
  getHistorial: () => request("/historial"),
  getTurnos: () => request("/turnos"),
};
