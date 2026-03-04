import Papa from "papaparse";

let cache = null;
let lastMonth = null;
const EAFO_CSV_URL = "https://alternative-fuels-observatory.ec.europa.eu/system/files/eafo_monthly_ev_registrations.csv";

function normalizeMonth(year, month) {
  const padded = month.toString().padStart(2, "0");
  return `${year}-${padded}`;
}

async function fetchAndParseEAFO() {
  try {
    const res = await fetch(EAFO_CSV_URL);
    if (!res.ok) throw new Error("EAFO CSV fetch failed: " + res.status);

    const text = await res.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });
  } catch (err) {
    console.error("Fetch/Parse error:", err);
    throw err;
  }
}

function transformData(rows) {
  const output = {};

  rows.forEach((row) => {
    try {
      const country = row["Country"] || row["country"];
      const year = row["Year"] || row["year"];
      const month = row["Month"] || row["month"];
      const powertrain = row["Powertrain"] || row["powertrain"];
      const registrations = parseInt(row["Registrations"] || row["registrations"] || "0");

      if (!country || !year || !month) return;
      if (powertrain && powertrain !== "BEV") return;

      const key = normalizeMonth(year, month);
      if (!output[country]) output[country] = {};
      if (!output[country][key]) output[country][key] = 0;
      output[country][key] += registrations;
    } catch (err) {
      console.error("Row parse error:", row, err);
    }
  });

  return output;
}

export default async function handler(req, res) {
  const currentMonth = new Date().getMonth();

  try {
    if (!cache || lastMonth !== currentMonth) {
      console.log("Refreshing EAFO data...");
      const rows = await fetchAndParseEAFO();
      cache = transformData(rows);
      lastMonth = currentMonth;
    }

    res.setHeader("Cache-Control", "s-maxage=86400");
    return res.status(200).json(cache);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Serverless function failed", details: err.message });
  }
}