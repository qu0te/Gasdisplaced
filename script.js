const fuelSlider = document.getElementById("fuelSlider");
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
