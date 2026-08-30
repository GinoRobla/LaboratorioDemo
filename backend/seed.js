import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const table = process.env.AIRTABLE_HISTORIAL_TABLE;

const http = axios.create({
  baseURL: `${AIRTABLE_API_URL}/${baseId}`,
  headers: { Authorization: `Bearer ${apiKey}` },
});

const randomDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 10) + 8);
  return d.toISOString();
};

const nombres = ["Laura G.", "Carlos M.", "Mariana P.", "Esteban V.", "Sofía L.", "Anónimo", "Lucía R.", "Federico T."];
const estudiosBasicos = ["Hemograma Completo", "Glucemia", "Urea", "Creatinina", "Colesterol Total"];
const estudiosExtra = ["Hepatograma", "Ferremia", "Sat. transferrina", "Triglicéridos", "Ionograma"];

async function run() {
  console.log(`Insertando datos en ${table}...`);
  try {
    for (let i = 1; i <= 15; i++) {
      const daysAgo = Math.floor(Math.random() * 6);
      const paciente = nombres[Math.floor(Math.random() * nombres.length)];
      
      const numEstudios = Math.floor(Math.random() * 4) + 2;
      const arr = [];
      for (let j = 0; j < numEstudios; j++) {
         if (Math.random() > 0.5) arr.push(estudiosBasicos[Math.floor(Math.random() * estudiosBasicos.length)]);
         else arr.push(estudiosExtra[Math.floor(Math.random() * estudiosExtra.length)]);
      }
      const matcheados = [...new Set(arr)].join(", ");
      
      const hasError = Math.random() > 0.7;
      const noReconocidos = hasError ? (Math.random() > 0.5 ? "Ilegible (?), Ferre..." : "T4 Libre (?)") : "";
      
      const total = (Math.floor(Math.random() * 50) + 10) * 1000;
      
      const fields = {
        Fecha: randomDate(daysAgo),
        Paciente: paciente,
        Telefono: "+5491100000000",
        LecturaIA: "```json\n{ \"estudios\": [" + matcheados.split(", ").map(x => `"${x}"`).join(", ") + "] }\n```",
        EstudiosMatcheados: matcheados,
        Total: total
      };

      await http.post(`/${encodeURIComponent(table)}`, { fields });
      console.log(`- Insertado registro ${i}`);
    }
    console.log("¡Listo!");
  } catch (err) {
    console.error(err?.response?.data || err.message);
  }
}
run();
