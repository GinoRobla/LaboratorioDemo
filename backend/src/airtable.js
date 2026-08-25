import axios from "axios";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function client() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Faltan AIRTABLE_API_KEY o AIRTABLE_BASE_ID en el .env");
  }
  return axios.create({
    baseURL: `${AIRTABLE_API_URL}/${baseId}`,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export async function listRecords(table, { sort, maxRecords } = {}) {
  const http = client();
  const records = [];
  let offset;
  do {
    const params = { offset, pageSize: 100 };
    if (sort) params.sort = sort;
    const { data } = await http.get(`/${encodeURIComponent(table)}`, { params });
    records.push(...data.records);
    offset = data.offset;
    if (maxRecords && records.length >= maxRecords) break;
  } while (offset);
  return maxRecords ? records.slice(0, maxRecords) : records;
}

export async function createRecord(table, fields) {
  const http = client();
  const { data } = await http.post(`/${encodeURIComponent(table)}`, { fields });
  return data;
}

export async function updateRecord(table, id, fields) {
  const http = client();
  const { data } = await http.patch(`/${encodeURIComponent(table)}/${id}`, { fields });
  return data;
}

export async function deleteRecord(table, id) {
  const http = client();
  const { data } = await http.delete(`/${encodeURIComponent(table)}/${id}`);
  return data;
}
