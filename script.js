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




// article building:
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

    // Create the content container (you can choose h3 or wrap the title in a link if needed)
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