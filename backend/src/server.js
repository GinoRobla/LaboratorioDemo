import "dotenv/config";
import express from "express";
import cors from "cors";
import catalogoRouter from "./routes/catalogo.js";
import historialRouter from "./routes/historial.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/catalogo", catalogoRouter);
app.use("/api/historial", historialRouter);

app.use((err, req, res, next) => {
  console.error(err.response?.data || err.message);
  res.status(err.response?.status || 500).json({
    error: err.response?.data?.error?.message || err.message || "Error interno",
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
