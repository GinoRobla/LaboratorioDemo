import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { IconChevronLeft, IconChevronRight, IconCalendar } from "./icons.jsx";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first offset (getDay: 0=Sun..6=Sat)
  const leading = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const ESTADO_COLOR = { Confirmado: "dot-ok", Pendiente: "dot-warn", Cancelado: "dot-off" };

export default function TurneroView() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    api
      .getTurnos()
      .then((data) => {
        setTurnos(data);
        const today = new Date();
        const withTurnoToday = data.find((t) => t.fechaHora && sameDay(new Date(t.fechaHora), today));
        setSelectedDay(withTurnoToday ? today : data[0]?.fechaHora ? new Date(data[0].fechaHora) : today);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cells = useMemo(() => buildGrid(monthDate), [monthDate]);

  const turnosPorDia = useMemo(() => {
    const map = new Map();
    for (const t of turnos) {
      if (!t.fechaHora) continue;
      const d = new Date(t.fechaHora);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }, [turnos]);

  function dayKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  const selectedTurnos = selectedDay ? turnosPorDia.get(dayKey(selectedDay)) || [] : [];

  return (
    <section>
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Cargando turnos…</p>
      ) : (
        <div className="calendar-layout">
          <div className="calendar-card">
            <div className="calendar-header">
              <button className="ghost-small icon-only" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
                <IconChevronLeft />
              </button>
              <span className="calendar-title">
                {MESES[monthDate.getMonth()]} {monthDate.getFullYear()}
              </span>
              <button className="ghost-small icon-only" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
                <IconChevronRight />
              </button>
            </div>

            <div className="calendar-grid calendar-weekdays">
              {DIAS.map((d) => (
                <div key={d} className="calendar-weekday">{d}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="calendar-cell empty" />;
                const dayTurnos = turnosPorDia.get(dayKey(date)) || [];
                const isToday = sameDay(date, new Date());
                const isSelected = selectedDay && sameDay(date, selectedDay);
                return (
                  <button
                    key={i}
                    className={`calendar-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedDay(date)}
                  >
                    <span className="cell-number">{date.getDate()}</span>
                    {dayTurnos.length > 0 && (
                      <span className="cell-dots">
                        {dayTurnos.slice(0, 3).map((t, idx) => (
                          <span key={idx} className={`dot ${ESTADO_COLOR[t.estado] || "dot-warn"}`} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="calendar-side">
            <h3 className="side-title">
              {selectedDay
                ? selectedDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
                : "Seleccioná un día"}
            </h3>
            {selectedTurnos.length === 0 ? (
              <div className="empty-state small">
                <div className="empty-state-icon">
                  <IconCalendar />
                </div>
                <p>Sin turnos este día.</p>
              </div>
            ) : (
              <ul className="turno-list">
                {selectedTurnos
                  .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
                  .map((t) => (
                    <li key={t.id} className="turno-item">
                      <div className="turno-time">
                        {new Date(t.fechaHora).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="turno-info">
                        <div className="turno-paciente">{t.paciente}</div>
                        <div className="turno-estudios muted">{t.estudios}</div>
                      </div>
                      <span className={`badge ${t.estado === "Confirmado" ? "badge-ok" : t.estado === "Cancelado" ? "badge-off" : "badge-warn"}`}>
                        {t.estado}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
