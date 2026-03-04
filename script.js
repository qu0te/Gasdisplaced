const fuelSlider = document.getElementById("fuelSlider");
const kmSlider = document.getElementById("kmSlider");
const priceSlider = document.getElementById("priceSlider");

const fuelValue = document.getElementById("fuelValue");
const kmValue = document.getElementById("kmValue");
const priceValue = document.getElementById("priceValue");

const totalFuelEl = document.getElementById("totalFuel");
const totalCO2El = document.getElementById("totalCO2");
const totalCashEl = document.getElementById("totalCash");

const resetBtn = document.getElementById("resetBtn");

const DEFAULT_FUEL = 6;
const DEFAULT_KM = 13500;
const DEFAULT_PRICE = 1.80;

let fuelChart;
let cashChart;
let currentData;

fuelSlider.oninput = () => fuelValue.textContent = fuelSlider.value;
kmSlider.oninput = () => kmValue.textContent = kmSlider.value;
priceSlider.oninput = () => priceValue.textContent = priceSlider.value;

resetBtn.onclick = () => {
  fuelSlider.value = DEFAULT_FUEL;
  kmSlider.value = DEFAULT_KM;
  priceSlider.value = DEFAULT_PRICE;

  fuelValue.textContent = DEFAULT_FUEL;
  kmValue.textContent = DEFAULT_KM;
  priceValue.textContent = DEFAULT_PRICE;

  updateAll();
};

async function fetchData() {
  const res = await fetch("/api/ev-data");
  return await res.json();
}

function aggregateData(data) {
  const combined = {};

  for (const country in data) {
    for (const month in data[country]) {
      if (!combined[month]) combined[month] = 0;
      combined[month] += data[country][month];
    }
  }

  return combined;
}

function calculateImpacts(monthlyRegs) {
  const fuel = parseFloat(fuelSlider.value);
  const kms = parseFloat(kmSlider.value);
  const price = parseFloat(priceSlider.value);

  const monthlyFuel = {};
  const monthlyCash = {};

  for (const month in monthlyRegs) {
    const regs = monthlyRegs[month];

    const yearlyLiters = regs * kms * (fuel / 100);
    const monthlyLiters = yearlyLiters / 12;

    monthlyFuel[month] = monthlyLiters;
    monthlyCash[month] = monthlyLiters * price;
  }

  return { monthlyFuel, monthlyCash };
}

function updateCounters(monthlyFuel, monthlyCash) {
  const totalFuel = Object.values(monthlyFuel)
    .reduce((a, b) => a + b, 0);

  const totalCash = Object.values(monthlyCash)
    .reduce((a, b) => a + b, 0);

  const totalCO2 = totalFuel * 2.31;

  totalFuelEl.textContent = totalFuel.toLocaleString();
  totalCO2El.textContent = totalCO2.toLocaleString();
  totalCashEl.textContent = totalCash.toLocaleString(undefined, {maximumFractionDigits:0});
}

function buildCharts(monthlyFuel, monthlyCash) {
  const fuelCtx = document.getElementById("chart").getContext("2d");
  const cashCtx = document.getElementById("cashChart").getContext("2d");

  const labels = Object.keys(monthlyFuel).sort();
  const fuelValues = labels.map(m => monthlyFuel[m]);
  const cashValues = labels.map(m => monthlyCash[m]);

  if (fuelChart) fuelChart.destroy();
  if (cashChart) cashChart.destroy();

  fuelChart = new Chart(fuelCtx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly Fuel Displaced (Liters)",
        data: fuelValues,
        borderColor: "green",
        fill: true
      }]
    }
  });

  cashChart = new Chart(cashCtx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly Cash Displaced (€)",
        data: cashValues,
        borderColor: "blue",
        fill: true
      }]
    }
  });
}

function updateAll() {
  const aggregated = aggregateData(currentData);
  const { monthlyFuel, monthlyCash } = calculateImpacts(aggregated);

  buildCharts(monthlyFuel, monthlyCash);
  updateCounters(monthlyFuel, monthlyCash);
}

async function init() {
  currentData = await fetchData();
  updateAll();

  fuelSlider.onchange = updateAll;
  kmSlider.onchange = updateAll;
  priceSlider.onchange = updateAll;
}

init();
