import { Router } from "express";
import { listRecords } from "../airtable.js";

const router = Router();
const table = () => process.env.AIRTABLE_TURNOS_TABLE || "Turnos";

function toItem(record) {
  return {
    id: record.id,
    fechaHora: record.fields.FechaHora || "",
    paciente: record.fields.Paciente || "",
    telefono: record.fields.Telefono || "",
    estudios: record.fields.Estudios || "",
    estado: record.fields.Estado || "Pendiente",
  };
}

router.get("/", async (req, res, next) => {
  try {
    const records = await listRecords(table(), { sort: [{ field: "FechaHora", direction: "asc" }] });
    res.json(records.map(toItem));
  } catch (err) {
    next(err);
  }
});

export default router;
