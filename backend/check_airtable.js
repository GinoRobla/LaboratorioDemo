import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const http = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`,
  headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
});

async function run() {
  try {
    const { data } = await http.get(`/${encodeURIComponent(process.env.AIRTABLE_HISTORIAL_TABLE)}?maxRecords=1`);
    console.log(data.records[0].fields);
  } catch(e) {
    console.error(e.message);
  }
}
run();
