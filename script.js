// Update current date and time every second
function updateDateTime() {
  const now = new Date();
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  document.getElementById("current-datetime").textContent =
    now.toLocaleDateString(undefined, options);
}
updateDateTime();
setInterval(updateDateTime, 1000);

// Toggle navigation overlay visibility with animation
document
  .getElementById("toggle-nav-overlay")
  .addEventListener("click", function () {
    const overlay = document.getElementById("nav-overlay");
    overlay.classList.toggle("opacity-0");
    overlay.style.pointerEvents = overlay.classList.contains("opacity-0")
      ? "none"
      : "auto";
  });

// RSS feed scrolling functionality
const rssFeedContainer = document.querySelector(".rss-feed-container");
const rssFeed = document.querySelector(".rss-feed");
let startTime = null;
let pauseStart = null;
const speed = 50; // pixels per second
const pauseDuration = 500; // pause duration in milliseconds

function animateRSSFeed(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;

  const containerWidth = rssFeedContainer.clientWidth;
  const feedWidth = rssFeed.scrollWidth;

  // Calculate current horizontal position (starting fully to the right)
  let distance = (elapsed / 1000) * speed;
  let currentX = containerWidth - distance;

  // When the feed has fully scrolled out, pause briefly and then reset
  if (currentX <= -feedWidth) {
    if (!pauseStart) {
      pauseStart = timestamp;
    }
    if (timestamp - pauseStart >= pauseDuration) {
      startTime = timestamp;
      pauseStart = null;
      currentX = containerWidth;
    } else {
      currentX = -feedWidth;
    }
  }

  rssFeed.style.transform = `translateX(${currentX}px)`;
  requestAnimationFrame(animateRSSFeed);
}
requestAnimationFrame(animateRSSFeed);

// Article building:
const content = {
  article: [
    [
      "https://placehold.co/400x200.svg?text=Article+Image+1",
      "https://example.com/article1",
      "Article Title 1",
      true, // 'first' flag - places the article at the beginning
      false, // 'highlight' flag - highlights the article with a different style
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+2",
      "https://example.com/article2",
      "Highlighted Article",
      false,
      true,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+3",
      "https://example.com/article3",
      "Article Title 3",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+4",
      "https://example.com/article4",
      "Article Title 4",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+5",
      "https://example.com/article5",
      "Article Title 5",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+6",
      "https://example.com/article6",
      "Article Title 6",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+7",
      "https://example.com/article7",
      "Article Title 7",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+8",
      "https://example.com/article8",
      "Article Title 8",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+9",
      "https://example.com/article9",
      "Article Title 9",
      false,
      false,
    ],
    [
      "https://placehold.co/400x200.svg?text=Article+Image+10",
      "https://example.com/article10",
      "Article Title 10",
      false,
      false,
    ],
  ],
};

function buildArticles() {
  const container = document.getElementById("articles-grid");

  // Process each article definition
  content.article.forEach((articleData) => {
    // Destructure the article data
    const [image, url, title, first, highlight] = articleData;

    // Create an anchor element to wrap the entire card
    const anchor = document.createElement("a");
    anchor.href = url;

    // Create the article card element
    const articleCard = document.createElement("article");
    articleCard.classList.add("article-card");
    if (highlight) {
      articleCard.classList.add("highlight");
    }

    // Create and append the image element
    const img = document.createElement("img");
    img.src = image;
    img.alt = title;
    articleCard.appendChild(img);

    // Create the content container
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("article-content");
    const titleElem = document.createElement("h3");
    titleElem.textContent = title;
    contentDiv.appendChild(titleElem);

    // Append the content to the article card
    articleCard.appendChild(contentDiv);

    // Place the article card inside the clickable anchor
    anchor.appendChild(articleCard);

    // Insert the article: if 'first' is true, add it to the beginning; otherwise, append.
    if (first) {
      container.insertBefore(anchor, container.firstChild);
    } else {
      container.appendChild(anchor);
    }
  });
}

// Call the function to build the articles
buildArticles();

// ------------------------------
// New Forecast API Integration with Adjustable Grouping, Date Column, and Slider Control
// ------------------------------

// Coordinates for Birkenes (updated lat and lon)
const LATITUDE = 58.33072;
const LONGITUDE = 8.23896;
const API_URL = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LATITUDE}&lon=${LONGITUDE}`;

// Select forecast table elements and grouping slider
const forecastBody = document.getElementById("forecast-body");
const forecastStatus = document.getElementById("forecast-status");
const groupingSlider = document.getElementById("groupingSlider");
const groupingValueDisplay = document.getElementById("groupingValue");

// Set initial grouping threshold from slider (in hPa)
let groupingThreshold = parseInt(groupingSlider.value, 10);

// Update grouping threshold when slider changes and reload forecast
groupingSlider.addEventListener("input", () => {
  groupingThreshold = parseInt(groupingSlider.value, 10);
  groupingValueDisplay.textContent = groupingThreshold;
  loadForecast(); // Reload forecast with new threshold
});

// Helper: Format ISO time string to HH:MM format
function formatTime(isoString) {
  const date = new Date(isoString);
  const options = { hour: "2-digit", minute: "2-digit" };
  return date.toLocaleTimeString([], options);
}

// Helper: Format date as "Wed, 26." (weekday first, then day)
function formatDate(isoString) {
  const date = new Date(isoString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  return `${weekday}, ${day}.`;
}

// Helper: Determine inline style for a pressure cell based on its value
function getPressureCellStyle(pressure) {
  let style = "";
  if (pressure >= 1035) {
    // 5+ hPa above 1030: blue background with green border
    style = "background-color: #0000ff; border: 2px solid #10b981;";
  } else if (pressure <= 990) {
    // 5+ hPa below 995: magenta background with red border
    style = "background-color: #ff00ff; border: 2px solid #ef4444;";
  } else {
    // Interpolate between red (995) and green (1030)
    let clamped = Math.max(995, Math.min(1030, pressure));
    let fraction = (clamped - 995) / (1030 - 995);
    let red = Math.round(255 * (1 - fraction));
    let green = Math.round(255 * fraction);
    let color = `rgb(${red}, ${green}, 0)`;
    style = `background-color: ${color};`;
  }
  return style;
}

// Fetch forecast data, group points, and update the table
async function loadForecast() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    const timeseries = data.properties.timeseries;
    if (!timeseries || timeseries.length === 0) {
      throw new Error("No forecast data available");
    }

    // Filter for upcoming points (with a 30-minute grace period)
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000);
    const futurePoints = timeseries.filter(
      (entry) => new Date(entry.time) >= cutoff
    );

    // Group consecutive points if their pressure difference is within groupingThreshold (in hPa)
    let groups = [];
    let currentGroup = [];
    futurePoints.forEach((point) => {
      if (currentGroup.length === 0) {
        currentGroup.push(point);
      } else {
        let lastPressure =
          currentGroup[currentGroup.length - 1].data.instant.details
            .air_pressure_at_sea_level;
        let currentPressure =
          point.data.instant.details.air_pressure_at_sea_level;
        if (Math.abs(currentPressure - lastPressure) <= groupingThreshold) {
          currentGroup.push(point);
        } else {
          groups.push(currentGroup);
          currentGroup = [point];
        }
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    // Build table rows with a Date column
    let rowsHTML = "";
    groups.forEach((group) => {
      // Format the Date column using the first point in the group
      const dateDisplay = formatDate(group[0].time);

      // Get start and end times for the group
      const startTime = group[0].time;
      const endTime = group[group.length - 1].time;
      const formattedStart = formatTime(startTime);
      const formattedEnd = formatTime(endTime);
      const timeDisplay =
        group.length > 1
          ? `${formattedStart} - ${formattedEnd}`
          : formattedStart;

      // Average values across the group
      let sumPressure = 0,
        sumTemp = 0,
        sumWind = 0;
      group.forEach((point) => {
        sumPressure += point.data.instant.details.air_pressure_at_sea_level;
        sumTemp += point.data.instant.details.air_temperature;
        sumWind += point.data.instant.details.wind_speed;
      });
      const avgPressure = Math.round(sumPressure / group.length);
      const avgTemp = Math.round(sumTemp / group.length);
      const avgWind = Math.round(sumWind / group.length);

      // Determine cell style for the pressure value
      const pressureStyle = getPressureCellStyle(avgPressure);

      rowsHTML += `<tr>
        <td>${dateDisplay}</td>
        <td>${timeDisplay}</td>
        <td style="${pressureStyle}">${avgPressure} hPa</td>
        <td>${avgTemp} °C</td>
        <td>${avgWind} m/s</td>
      </tr>`;
    });

    forecastBody.innerHTML = rowsHTML;
    forecastStatus.classList.add("hidden");
  } catch (error) {
    console.error("Error loading forecast data:", error);
    forecastStatus.textContent = "Failed to load forecast data.";
  }
}

// Load forecast after the DOM has loaded
document.addEventListener("DOMContentLoaded", loadForecast);
