let cache = null;
let lastUpdatedMonth = null;

async function fetchCountryData() {
  // Replace these URLs with real APIs or datasets
  const sources = {
    germany: "https://example.com/germany.json",
    uk: "https://example.com/uk.json",
    norway: "https://example.com/norway.json",
    france: "https://example.com/france.json",
    usa: "https://example.com/usa.json"
  };

  const results = {};

  for (const country in sources) {
    try {
      const res = await fetch(sources[country]);
      results[country] = await res.json();
    } catch (err) {
      results[country] = {};
    }
  }

  return results;
}

export default async function handler(req, res) {
  const currentMonth = new Date().getMonth();

  if (!cache || lastUpdatedMonth !== currentMonth) {
    console.log("Refreshing EV registration data...");
    cache = await fetchCountryData();
    lastUpdatedMonth = currentMonth;
  }

  res.setHeader("Cache-Control", "s-maxage=86400");
  res.status(200).json(cache);
}
