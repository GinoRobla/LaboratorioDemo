import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const http = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`,
  headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
});

const table = process.env.AIRTABLE_HISTORIAL_TABLE;

async function clear() {
  try {
    const { data } = await http.get(`/${encodeURIComponent(table)}`);
    const records = data.records;
    const toDelete = records.filter(r => r.fields.Telefono === "+5491100000000");
    
    console.log(`Borrando ${toDelete.length} registros falsos...`);
    
    for (const r of toDelete) {
      await http.delete(`/${encodeURIComponent(table)}/${r.id}`);
    }
    console.log("Limpieza completada.");
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
clear();
