import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconChevronLeft, IconChevronRight, IconCalendar } from "./icons.jsx";
import Pagination from "./Pagination.jsx";

const ESTADO_BADGE = {
  Confirmado: "badge-ok",
  Pendiente: "badge-warn",
  Cancelado: "badge-off",
};

const PAGE_SIZE = 10;

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TurneroView() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .getTurnos()
      .then((data) => {
        setTurnos(data);
        const today = new Date();
        const withTurnoToday = data.some((t) => t.fechaHora && sameDay(new Date(t.fechaHora), today));
        if (!withTurnoToday && data.length > 0 && data[0].fechaHora) {
          setSelectedDate(new Date(data[0].fechaHora));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const turnosDelDia = useMemo(
    () =>
      turnos
        .filter((t) => t.fechaHora && sameDay(new Date(t.fechaHora), selectedDate))
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)),
    [turnos, selectedDate]
  );

  useEffect(() => {
    setPage(1);
  }, [selectedDate]);

  const totalPages = Math.max(1, Math.ceil(turnosDelDia.length / PAGE_SIZE));
  const turnosPagina = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return turnosDelDia.slice(start, start + PAGE_SIZE);
  }, [turnosDelDia, page]);

  function shiftDay(delta) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  return (
    <section>
      {error && <p className="error">{error}</p>}

      <div className="day-nav">
        <button className="icon-only secondary" onClick={() => shiftDay(-1)}>
          <IconChevronLeft />
        </button>
        <span className="day-nav-label">
          {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <button className="icon-only secondary" onClick={() => shiftDay(1)}>
          <IconChevronRight />
        </button>
      </div>

      <div className="day-picker-row">
        <input
          type="date"
          value={toInputDate(selectedDate)}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
          }}
        />
        <button className="ghost-small" onClick={goToday}>
          Ir a hoy
        </button>
        {turnosDelDia.length > 0 && (
          <span className="muted day-count">
            {turnosDelDia.length} turno{turnosDelDia.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="muted">Cargando turnos…</p>
      ) : turnosDelDia.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconCalendar />
          </div>
          <p>No hay turnos agendados para este día.</p>
        </div>
      ) : (
        <div className="turno-day-list">
          {turnosPagina.map((t) => (
            <div key={t.id} className="turno-row">
              <div className="turno-row-time">
                {new Date(t.fechaHora).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} hs
              </div>
              <div className="turno-row-info">
                <div className="turno-row-estudios">{t.estudios}</div>
                <div className="turno-row-paciente muted">
                  {t.paciente}
                  {t.telefono ? ` (${t.telefono})` : ""}
                </div>
              </div>
              <span className={`badge ${ESTADO_BADGE[t.estado] || "badge-warn"}`}>{t.estado}</span>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
