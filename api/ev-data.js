import Papa from "papaparse";

let cache = null;
let lastMonth = null;

async function fetchCsvData(url) {
  const res = await fetch(url);
  const text = await res.text();
  return new Promise(resolve => {
    Papa.parse(text, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      }
    });
  });
}

export default async function handler(req, res) {
  const currentMonth = new Date().getMonth();

  if (!cache || lastMonth !== currentMonth) {
    console.log("Refreshing EV registration data...");

    // Example CSV source for European EVs
    const eafoCsvUrl = "https://alternative-fuels-observatory.ec.europa.eu/system/files/eafo_monthly_ev_registrations.csv";

    const euData = await fetchCsvData(eafoCsvUrl);

    const parsed = {};
    euData.forEach(row => {
      const month = row["Month"];
      const country = row["Country"];
      const evRegs = parseInt(row["Electric_Vehicles"] || "0");

      if (!parsed[country]) parsed[country] = {};
      parsed[country][month] = evRegs;
    });

    cache = parsed;
    lastMonth = currentMonth;
  }

  res.setHeader("Cache-Control", "s-maxage=86400");
  res.status(200).json(cache);
}
