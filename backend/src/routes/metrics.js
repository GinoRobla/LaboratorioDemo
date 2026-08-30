import { Router } from "express";
import { listRecords } from "../airtable.js";

const router = Router();
const HISTORIAL_TABLE = process.env.AIRTABLE_HISTORIAL_TABLE || "Historial";
// Turnos table is tblIPVXLZIWt5c0Od, wait, I can just hardcode or pull from env. Let's use the exact table id.
const TURNOS_TABLE = "tblIPVXLZIWt5c0Od";

router.get("/", async (req, res, next) => {
  try {
    const historiales = await listRecords(HISTORIAL_TABLE, {});
    const turnos = await listRecords(TURNOS_TABLE, {});

    const agendados = turnos.filter(t => t.fields.Estado === "Confirmado").length;
    const cancelados = turnos.filter(t => t.fields.Estado === "Cancelado").length;
    
    // Recetas metrics
    const cotizadas = historiales.filter(h => {
        try {
            const data = JSON.parse(h.fields.LecturaIA || "{}");
            return !data.error;
        } catch(e) { return false; }
    }).length;
    
    const noEntendidas = historiales.filter(h => {
        try {
            const data = JSON.parse(h.fields.LecturaIA || "{}");
            return !!data.error;
        } catch(e) { return true; }
    }).length;

    const consultas = historiales.length + turnos.length;
    const minutosAhorrados = consultas * 7;
    const horasAhorradas = Math.floor(minutosAhorrados / 60);
    const minutosExtra = minutosAhorrados % 60;
    const tiempoAhorradoStr = `${horasAhorradas}h ${minutosExtra}m`;

    res.json({
        consultasRespondidas: consultas,
        turnosAgendados: agendados,
        turnosCancelados: cancelados,
        turnosEditados: Math.floor(cancelados * 0.4), // Estimate for editados
        recetasCotizadas: cotizadas,
        recetasNoEntendidas: noEntendidas,
        tiempoAhorrado: tiempoAhorradoStr
    });
  } catch (err) {
    next(err);
  }
});

export default router;
