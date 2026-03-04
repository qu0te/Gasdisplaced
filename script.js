const fuelSlider = document.getElementById("fuelSlider");
const kmSlider = document.getElementById("kmSlider");
const fuelValue = document.getElementById("fuelValue");
const kmValue = document.getElementById("kmValue");
const resetBtn = document.getElementById("resetBtn");

const totalFuelEl = document.getElementById("totalFuel");
const totalCO2El = document.getElementById("totalCO2");

const DEFAULT_FUEL = 6;
const DEFAULT_KM = 13500;

let chart;
let currentData;

fuelSlider.oninput = () => fuelValue.textContent = fuelSlider.value;
kmSlider.oninput = () => kmValue.textContent = kmSlider.value;

resetBtn.onclick = () => {
  fuelSlider.value = DEFAULT_FUEL;
  kmSlider.value = DEFAULT_KM;
  fuelValue.textContent = DEFAULT_FUEL;
  kmValue.textContent = DEFAULT_KM;
  updateChart();
};

async function fetchData() {
  const res = await fetch("/api/ev-data");
  return await res.json();
}

function aggregateData(data) {
  const combined = {};

  for (const country in data) {
    const months = data[country];
    for (const month in months) {
      if (!combined[month]) combined[month] = 0;
      combined[month] += months[month];
    }
  }

  return combined;
}

function calculateLiters(monthlyRegs) {
  const fuel = parseFloat(fuelSlider.value);
  const kms = parseFloat(kmSlider.value);

  const liters = {};
  for (const month in monthlyRegs) {
    liters[month] = monthlyRegs[month] * kms * (fuel / 100);
  }

  return liters;
}

function updateCounters(totalLiters) {
  const totalCO2 = totalLiters * 2.31;

  totalFuelEl.textContent = totalLiters.toLocaleString();
  totalCO2El.textContent = totalCO2.toLocaleString();
}

function buildChart(monthlyLiters) {
  const ctx = document.getElementById("chart").getContext("2d");
  const labels = Object.keys(monthlyLiters).sort();
  const values = labels.map(m => monthlyLiters[m]);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly Fuel Displaced (Liters)",
        data: values,
        borderColor: "green",
        fill: true
      }]
    }
  });
}

function updateChart() {
  const aggregated = aggregateData(currentData);
  const liters = calculateLiters(aggregated);

  const totalLiters = Object.values(liters)
    .reduce((a, b) => a + b, 0);

  buildChart(liters);
  updateCounters(totalLiters);
}

async function init() {
  currentData = await fetchData();
  updateChart();

  fuelSlider.onchange = updateChart;
  kmSlider.onchange = updateChart;
}

init();const fuelSlider = document.getElementById("fuelSlider");
const kmSlider = document.getElementById("kmSlider");
const fuelValue = document.getElementById("fuelValue");
const kmValue = document.getElementById("kmValue");
const ctx = document.getElementById("chart").getContext("2d");
const resetBtn = document.getElementById("resetBtn");

const DEFAULT_FUEL = 6;
const DEFAULT_KM = 13500;

resetBtn.onclick = () => {
  fuelSlider.value = DEFAULT_FUEL;
  kmSlider.value = DEFAULT_KM;

  fuelValue.textContent = DEFAULT_FUEL;
  kmValue.textContent = DEFAULT_KM;

  updateChart(currentData);
};
let currentData;
let chart;

// update labels
fuelSlider.oninput = () => fuelValue.textContent = fuelSlider.value;
kmSlider.oninput   = () => kmValue.textContent   = kmSlider.value;

// main
async function init() {
  currentData = await fetchEvData();
  buildChart(currentData);

  fuelSlider.onchange = () => updateChart(currentData);
  kmSlider.onchange   = () => updateChart(currentData);
}

async function fetchEvData() {
  const cacheKey = "ev_reg_germany";
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const res = await fetch("ev_reg_germany.json");
  const json = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify(json));
  return json;
}

function buildChart(evData) {
  const labels = Object.keys(evData).sort();
  const values = labels.map(m => evData[m]);

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Liters Avoided",
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        fill: true,
        data: values.map((_,i) => 0)
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { title: { text: "Liters avoided", display: true } },
        x: { title: { text: "Month", display: true } }
      }
    }
  });

  updateChart(evData);
}

function updateChart(evData) {
  const fuel = parseFloat(fuelSlider.value);
  const kms  = parseFloat(kmSlider.value);

  const labels = Object.keys(evData).sort();
  const liters = labels.map(month => {
    const count = evData[month];
    return count * kms * (fuel / 100);
  });

  chart.data.datasets[0].data = liters;
  chart.update();
}

init();
