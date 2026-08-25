import { Router } from "express";
import { listRecords } from "../airtable.js";

const router = Router();
const table = () => process.env.AIRTABLE_HISTORIAL_TABLE;

function toItem(record) {
  return {
    id: record.id,
    fecha: record.fields.Fecha || "",
    paciente: record.fields.Paciente || "",
    textoOcr: record.fields.TextoOCR || "",
    estudiosMatcheados: record.fields.EstudiosMatcheados || "",
    noReconocidos: record.fields.NoReconocidos || "",
    total: record.fields.Total ?? 0,
    imagenUrl: record.fields.Imagen?.[0]?.url || "",
  };
}

router.get("/", async (req, res, next) => {
  try {
    const records = await listRecords(table(), { sort: [{ field: "Fecha", direction: "desc" }] });
    res.json(records.map(toItem));
  } catch (err) {
    next(err);
  }
});

export default router;
