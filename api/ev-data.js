import Papa from "papaparse";

let cache = null;
let lastMonth = null;

const EAFO_CSV_URL =
  "https://alternative-fuels-observatory.ec.europa.eu/system/files/eafo_monthly_ev_registrations.csv";

function normalizeMonth(year, month) {
  const padded = month.toString().padStart(2, "0");
  return `${year}-${padded}`;
}

async function fetchAndParseEAFO() {
  const res = await fetch(EAFO_CSV_URL);
  const text = await res.text();

  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
    });
  });
}

function transformData(rows) {
  const output = {};

  rows.forEach((row) => {
    /**
     * You MUST adjust these column names
     * depending on actual EAFO CSV headers.
     *
     * Common EAFO headers look like:
     * Country
     * Year
     * Month
     * Powertrain
     * Registrations
     */

    const country = row["Country"];
    const year = row["Year"];
    const month = row["Month"];
    const powertrain = row["Powertrain"];
    const registrations = parseInt(row["Registrations"] || "0");

    if (!country || !year || !month) return;

    // Optional: only count BEV
    if (powertrain && powertrain !== "BEV") return;

    const key = normalizeMonth(year, month);

    if (!output[country]) {
      output[country] = {};
    }

    if (!output[country][key]) {
      output[country][key] = 0;
    }

    output[country][key] += registrations;
  });

  return output;
}

export default async function handler(req, res) {
  const currentMonth = new Date().getMonth();

  if (!cache || lastMonth !== currentMonth) {
    console.log("Refreshing EAFO data...");

    try {
      const rows = await fetchAndParseEAFO();
      cache = transformData(rows);
      lastMonth = currentMonth;
    } catch (err) {
      console.error("EAFO fetch failed:", err);
      return res.status(500).json({ error: "Data fetch failed" });
    }
  }

  res.setHeader("Cache-Control", "s-maxage=86400");
  res.status(200).json(cache);
}
