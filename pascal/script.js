/***************************************
 * Global Configuration and Variables
 ***************************************/
let timeFrame = "24h"; // Default timeframe is 24 hours
const apiUrl =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=58.33072&lon=8.23896";
const fetchInterval = 5 * 60 * 1000; // 5 minutes
let chart; // Global Chart.js instance
let currentForecast = []; // Store current forecast data

/***************************************
 * Trend Toggle Event Listeners & Styling
 ***************************************/
const toggleButtons = {
  "24h": document.getElementById("btn-24h"),
  "7d": document.getElementById("btn-7d"),
  max: document.getElementById("btn-max"),
};

function updateToggleStyles() {
  for (const [key, btn] of Object.entries(toggleButtons)) {
    if (key === timeFrame) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  }
}

toggleButtons["24h"].addEventListener("click", function () {
  timeFrame = "24h";
  updateToggleStyles();
  updateData();
});
toggleButtons["7d"].addEventListener("click", function () {
  timeFrame = "7d";
  updateToggleStyles();
  updateData();
});
toggleButtons["max"].addEventListener("click", function () {
  timeFrame = "max";
  updateToggleStyles();
  updateData();
});

updateToggleStyles();

/***************************************
 * Utility Functions
 ***************************************/
function customFormat(isoTime) {
  const date = new Date(isoTime);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const days = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
  const weekday = days[date.getDay()];
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}.${month}, ${weekday}\t${time}`;
}
const chartLabelFormat = customFormat;

function getTrendIndicator(current, nextValue) {
  if (nextValue == null)
    return { arrow: "", color: "text-gray-500", label: "Ingen data" };
  const diff = nextValue - current;
  if (Math.abs(diff) < 0.5)
    return { arrow: "→", color: "text-gray-500", label: "Uendret" };
  return diff > 0
    ? { arrow: "▲", color: "text-green-500", label: "Stigende" }
    : { arrow: "▼", color: "text-red-500", label: "Fallende" };
}

/***************************************
 * Pressure Color Gradient Function (for area fill)
 ***************************************/
function getPressureColor(pressure) {
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }
  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  const lowerLimit = 995;
  const upperLimit = 1030;
  const lowerExtreme = 990;
  const upperExtreme = 1035;

  const magenta = hexToRgb("#ff00ff");
  const red = hexToRgb("#ff0000");
  const green = hexToRgb("#00ff00");
  const blue = hexToRgb("#0000ff");

  if (pressure <= lowerExtreme)
    return rgbToHex(magenta.r, magenta.g, magenta.b);
  if (pressure >= upperExtreme) return rgbToHex(blue.r, blue.g, blue.b);
  if (pressure < lowerLimit) {
    const t = (pressure - lowerExtreme) / (lowerLimit - lowerExtreme);
    const rVal = Math.round(lerp(magenta.r, red.r, t));
    const gVal = Math.round(lerp(magenta.g, red.g, t));
    const bVal = Math.round(lerp(magenta.b, red.b, t));
    return rgbToHex(rVal, gVal, bVal);
  }

  if (pressure <= upperLimit) {
    let t = (pressure - lowerLimit) / (upperLimit - lowerLimit);
    if (t < 0.5) {
      let localT = t / 0.5;
      let r = 255;
      let g = Math.round(lerp(0, 255, localT));
      let b = 0;
      return rgbToHex(r, g, b);
    } else {
      let localT = (t - 0.5) / 0.5;
      let r = Math.round(lerp(255, 0, localT));
      let g = 255;
      let b = 0;
      return rgbToHex(r, g, b);
    }
  }

  if (pressure <= upperExtreme) {
    const t = (pressure - upperLimit) / (upperExtreme - upperLimit);
    const rVal = Math.round(lerp(green.r, blue.r, t));
    const gVal = Math.round(lerp(green.g, blue.g, t));
    const bVal = Math.round(lerp(green.b, blue.b, t));
    return rgbToHex(rVal, gVal, bVal);
  }
  return rgbToHex(green.r, green.g, green.b);
}

/***************************************
 * API Integration Functions
 ***************************************/
async function fetchPressureData() {
  try {
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "MyWeatherApp/1.0 (your_email@example.com)" },
    });
    if (!response.ok) {
      console.error("API fetch error:", response.status, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching pressure data:", error);
    return null;
  }
}

function processData(data) {
  const timeseries = data.properties.timeseries;
  const now = new Date();
  let endTime;
  if (timeFrame === "24h") {
    endTime = now.getTime() + 24 * 60 * 60 * 1000;
  } else if (timeFrame === "7d") {
    endTime = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  } else {
    // "max"
    endTime = Infinity;
  }
  const filtered = timeseries.filter((entry) => {
    const entryTime = new Date(entry.time).getTime();
    return entryTime >= now.getTime() && entryTime <= endTime;
  });
  return filtered.map((entry) => {
    const time = entry.time;
    const pressure = entry.data.instant.details.air_pressure_at_sea_level;
    return { time, pressure };
  });
}

/***************************************
 * Custom Tooltip Handling (Snap to Left)
 ***************************************/
function attachCustomTooltip() {
  const canvas = document.getElementById("pressureChart");
  const tooltipEl = document.getElementById("chartjs-tooltip");

  canvas.addEventListener("mousemove", function (e) {
    if (!chart) return;
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;

    const meta = chart.getDatasetMeta(0);
    if (!meta.data.length) return;
    let chosenIndex = 0;
    for (let i = 0; i < meta.data.length; i++) {
      const pt = meta.data[i].getCenterPoint();
      if (pt.x > mouseX) {
        chosenIndex = i > 0 ? i - 1 : 0;
        break;
      } else {
        chosenIndex = i;
      }
    }

    const forecastData = currentForecast[chosenIndex];
    if (forecastData) {
      const date = new Date(forecastData.time);
      const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
      };
      const formattedDate = new Intl.DateTimeFormat("no-NO", options).format(
        date
      );
      const pressureValue = forecastData.pressure;

      tooltipEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${formattedDate}</div>
        <div style="display: flex; justify-content: space-between;">
          <span>Trykk:</span>
          <span>${pressureValue} hPa</span>
        </div>`;

      tooltipEl.style.left = e.pageX + 10 + "px";
      tooltipEl.style.top = e.pageY + 10 + "px";
      tooltipEl.style.opacity = 1;
    } else {
      tooltipEl.style.opacity = 0;
    }
  });

  canvas.addEventListener("mouseout", function () {
    tooltipEl.style.opacity = 0;
  });
}

/***************************************
 * Chart Dot Hover Expansion
 ***************************************/
function getPointRadius(context) {
  const index = context.dataIndex;
  const active = context.chart._active || [];
  for (let i = 0; i < active.length; i++) {
    if (active[i].index === index) {
      return 10;
    }
  }
  return 3;
}

/***************************************
 * UI Update Functions
 ***************************************/
function updateSummaryBox(forecast) {
  if (forecast.length === 0) return;
  const currentData = forecast[0];
  const currentPressure = currentData.pressure;
  document.getElementById("current-pressure").textContent =
    currentPressure + " hPa";

  let trendIndicator = {
    arrow: "",
    color: "text-gray-500",
    label: "Ingen data",
  };
  if (forecast.length > 1) {
    if (new Date(forecast[0].time) < new Date(forecast[1].time)) {
      trendIndicator = getTrendIndicator(
        forecast[0].pressure,
        forecast[1].pressure
      );
    } else {
      trendIndicator = getTrendIndicator(
        forecast[1].pressure,
        forecast[0].pressure
      );
    }
  }
  document.getElementById(
    "pressure-trend"
  ).innerHTML = `<span class="${trendIndicator.color} font-bold">${trendIndicator.arrow}</span> ${trendIndicator.label}`;
}

function updateTable(forecast) {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = "";
  forecast.forEach((entry, index) => {
    let trendIndicator = {
      arrow: "",
      color: "text-gray-500",
      label: "Ingen data",
    };
    if (index < forecast.length - 1) {
      trendIndicator = getTrendIndicator(
        entry.pressure,
        forecast[index + 1].pressure
      );
    }
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${customFormat(entry.time)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span>${entry.pressure} hPa</span>
        <div class="mt-1 h-1 pressure-line" style="background-color: ${getPressureColor(
          entry.pressure
        )};"></div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap ${trendIndicator.color}">
        ${trendIndicator.arrow} ${trendIndicator.label}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function updateChart(forecast) {
  const ctx = document.getElementById("pressureChart").getContext("2d");
  const labels = forecast.map((entry) => chartLabelFormat(entry.time));
  const dataPoints = forecast.map((entry) => entry.pressure);

  const minPressure = Math.min(...dataPoints);
  const maxPressure = Math.max(...dataPoints);
  const pad = 2;

  const gridColor = "rgba(0,0,0,0.1)";
  const borderColor = "#2563eb";

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = dataPoints;
    chart.options.scales.y.suggestedMin = Math.floor(minPressure) - pad;
    chart.options.scales.y.suggestedMax = Math.ceil(maxPressure) + pad;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.data.datasets[0].borderColor = borderColor;
    const gradient = ctx.createLinearGradient(
      chart.chartArea.left,
      0,
      chart.chartArea.right,
      0
    );
    dataPoints.forEach((value, i) => {
      let pos = i / (dataPoints.length - 1);
      gradient.addColorStop(pos, getPressureColor(value));
    });
    chart.data.datasets[0].backgroundColor = gradient;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Trykk (hPa)",
            data: dataPoints,
            fill: true,
            borderWidth: 2,
            borderColor: borderColor,
            tension: 0.2,
            pointRadius: getPointRadius,
            pointHoverRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        events: ["mousemove", "mouseout", "click"],
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
        },
        scales: {
          x: {
            display: true,
            ticks: { display: false },
            grid: { display: true, color: gridColor },
            title: { display: true, text: "Tid" },
          },
          y: {
            display: true,
            grid: { display: true, color: gridColor },
            title: { display: true, text: "Trykk (hPa)" },
            suggestedMin: Math.floor(minPressure) - pad,
            suggestedMax: Math.ceil(maxPressure) + pad,
          },
        },
      },
      plugins: [
        {
          id: "customFillGradient",
          afterLayout(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const gradient = ctx.createLinearGradient(
              chartArea.left,
              0,
              chartArea.right,
              0
            );
            const data = chart.data.datasets[0].data;
            data.forEach((value, i) => {
              let pos = i / (data.length - 1);
              gradient.addColorStop(pos, getPressureColor(value));
            });
            chart.data.datasets[0].backgroundColor = gradient;
          },
        },
      ],
    });
    attachCustomTooltip();
  }
}

async function updateData() {
  const rawData = await fetchPressureData();
  if (!rawData) return;
  const forecast = processData(rawData);
  if (forecast.length === 0) {
    console.warn("Ingen prognosedata tilgjengelig.");
    return;
  }
  currentForecast = forecast;
  updateSummaryBox(forecast);
  updateTable(forecast);
  updateChart(forecast);
}

updateData();
setInterval(updateData, fetchInterval);
