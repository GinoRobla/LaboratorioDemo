import { Router } from "express";
import { listRecords, createRecord, updateRecord, deleteRecord } from "../airtable.js";

const router = Router();
const table = () => process.env.AIRTABLE_CATALOGO_TABLE;

function toItem(record) {
  return {
    id: record.id,
    nombre: record.fields.Nombre || "",
    codigo: record.fields.Codigo || "",
    precio: record.fields.Precio ?? 0,
    sinonimos: record.fields.Sinonimos || "",
  };
}

function toFields(body) {
  const fields = {};
  if (body.nombre !== undefined) fields.Nombre = body.nombre;
  if (body.codigo !== undefined) fields.Codigo = body.codigo;
  if (body.precio !== undefined) fields.Precio = Number(body.precio);
  if (body.sinonimos !== undefined) fields.Sinonimos = body.sinonimos;
  return fields;
}

router.get("/", async (req, res, next) => {
  try {
    const records = await listRecords(table(), { sort: [{ field: "Nombre", direction: "asc" }] });
    res.json(records.map(toItem));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body.nombre || req.body.precio === undefined) {
      return res.status(400).json({ error: "nombre y precio son obligatorios" });
    }
    const record = await createRecord(table(), toFields(req.body));
    res.status(201).json(toItem(record));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const record = await updateRecord(table(), req.params.id, toFields(req.body));
    res.json(toItem(record));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteRecord(table(), req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
