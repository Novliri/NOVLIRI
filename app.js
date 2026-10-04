const tools = globalThis.NOVLIRI_TOOLS || [];
const grid = document.querySelector("#toolGrid");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const empty = document.querySelector("#empty");
const toolCount = document.querySelector("#toolCount");
let searchSubmitted = false;

if (toolCount) toolCount.textContent = tools.length;

function toolSlug(name) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createToolCard(tool) {
  const article = document.createElement("article");
  article.className = "tool-card";

  const top = document.createElement("div");
  top.className = "tool-top";

  const icon = document.createElement("div");
  icon.className = "tool-icon";
  icon.textContent = tool.name.slice(0, 1);

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = tool.cat;

  top.append(icon, tag);

  const heading = document.createElement("h3");
  const detailLink = document.createElement("a");
  detailLink.href = `tools/${toolSlug(tool.name)}/`;
  detailLink.textContent = tool.name;
  detailLink.setAttribute("aria-label", `Learn more about ${tool.name}`);
  heading.appendChild(detailLink);

  const description = document.createElement("p");
  description.textContent = tool.desc;

  const bottom = document.createElement("div");
  bottom.className = "tool-bottom";

  const price = document.createElement("span");
  price.textContent = tool.price;

  const link = document.createElement("a");
  link.textContent = "Visit ↗";
  link.target = "_blank";
  link.rel = tool.affiliate ? "noopener sponsored" : "noopener";

  // Only allow normal HTTPS destinations from directory data.
  try {
    const destination = new URL(tool.url);
    if (destination.protocol === "https:") {
      link.href = destination.href;
    } else {
      throw new Error("Unsupported URL protocol");
    }
  } catch {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
  }

  bottom.append(price, link);
  article.append(top, heading, description);

  if (tool.thirdParty) {
    const notice = document.createElement("p");
    notice.className = "third-party-notice";
    notice.textContent = `Third-party project by ${tool.creator || "its respective creator"}. NOVLIRI does not own, operate, or endorse this project. Names and trademarks belong to their respective owners.`;
    article.appendChild(notice);
    if (tool.originalProject) link.textContent = "Original project ↗";
  }

  article.append(bottom);

  return article;
}

// Homepage Trending Tools. These are a curated snapshot of tools with strong
// current public search interest; keep the list easy to update as trends change.
const trendingToolGrid = document.querySelector("#trendingToolGrid");
const trendingToolNames = ["ChatGPT", "Canva", "Gemini", "Claude", "Grammarly", "CapCut"];

function renderTrendingTools() {
  if (!trendingToolGrid) return;
  const fragment = document.createDocumentFragment();
  trendingToolNames.forEach(name => {
    const tool = tools.find(item => item.name === name);
    if (!tool) return;
    const card = createToolCard(tool);
    card.classList.add("trending-tool-card");
    fragment.appendChild(card);
  });
  trendingToolGrid.replaceChildren(fragment);
}

// Natural-language search vocabulary. Visitors can search by what they
// want to accomplish instead of needing to know a product name.
const searchIntents = {
  logo: ["logo", "brand", "branding"],
  design: ["design", "graphic", "graphics", "visual", "creative", "image"],
  writing: ["write", "writing", "grammar", "spelling", "proofread", "rewrite", "essay", "copy"],
  research: ["research", "answer", "information", "sources"],
  education: ["school", "homework", "study", "studying", "student", "learn", "education", "class", "course"],
  math: ["math", "mathematics", "calculate", "equation", "algebra"],
  website: ["website", "web site", "webpage", "landing page", "no code", "no-code"],
  coding: ["code", "coding", "programming", "developer", "software development", "debug"],
  video: ["video", "edit video", "video editor", "video editing"],
  audio: ["audio", "podcast", "transcription", "sound"],
  marketing: ["marketing", "promote", "promotion", "audience", "campaign"],
  social: ["social", "social media", "post", "posts", "content creator"],
  email: ["email", "newsletter", "mailing list", "email marketing"],
  automation: ["automate", "automation", "workflow", "repetitive", "connect apps"],
  productivity: ["productive", "productivity", "organize", "organization", "tasks", "to do", "todo"],
  projects: ["project", "projects", "project management", "tasks", "team work"],
  scheduling: ["schedule", "scheduling", "appointment", "booking"],
  business: ["business", "company", "small business", "manage business", "operations"],
  sales: ["sales", "sell", "selling", "crm", "customers", "leads"],
  ecommerce: ["ecommerce", "e-commerce", "online store", "store", "shop", "sell online"],
  accounting: ["accounting", "bookkeeping", "invoice", "invoicing", "expenses", "finance"],
  communication: ["communicate", "communication", "chat", "message", "team communication"],
  meetings: ["meeting", "meetings", "video call", "conference"],
  storage: ["storage", "cloud storage", "files", "file sharing", "share files"],
  documents: ["document", "documents", "spreadsheet", "presentation", "office"],
  notes: ["notes", "note taking", "knowledge", "wiki"],
  ai: ["ai", "artificial intelligence", "assistant", "chatbot"],
  languages: ["language", "languages", "learn language", "translation"],
  photos: ["photo", "photos", "photography", "stock photo", "images"],
  ui: ["ui", "ux", "prototype", "wireframe", "interface design"],
  hosting: ["hosting", "deploy", "deployment", "host website"],
  seo: ["seo", "search engine optimization", "keyword", "keywords", "backlinks"],
  security: ["security", "privacy", "password", "passwords", "vpn", "protect"],
  transcription: ["transcription", "transcribe", "meeting notes", "speech to text"],
  streaming: ["stream", "streaming", "live stream", "record screen"],
  forms: ["form", "forms", "survey", "surveys", "quiz", "feedback"],
  modding: ["mod", "mods", "modding", "game mod", "game mods", "game modding", "mod a game", "mod pc game", "minecraft mod", "terraria mod", "gta mod"]
};

// High-confidence task rules give extra weight to products that genuinely
// perform the requested job, rather than merely mentioning a related word.
const taskRules = [
  { phrases: ["logo", "branding", "make a logo", "create a logo"], names: ["Canva", "Adobe Express", "Figma"], bonus: 45 },
  { phrases: ["edit video", "video editor", "video editing"], names: ["DaVinci Resolve", "CapCut", "Descript", "Adobe Express", "Canva"], bonus: 50 },
  { phrases: ["remove background", "remove image background", "background remover"], names: ["remove.bg", "Photopea", "Adobe Express", "Canva"], bonus: 55 },
  { phrases: ["seo", "keyword research", "find keywords", "backlinks"], names: ["Semrush", "Ahrefs", "Ubersuggest"], bonus: 50 },
  { phrases: ["password manager", "save passwords", "protect passwords"], names: ["Bitwarden", "1Password"], bonus: 55 },
  { phrases: ["vpn", "private browsing", "protect my connection"], names: ["Proton VPN", "NordVPN"], bonus: 50 },
  { phrases: ["transcribe", "transcription", "meeting notes"], names: ["Otter.ai", "Descript"], bonus: 50 },
  { phrases: ["live stream", "streaming", "record my screen"], names: ["OBS Studio", "Loom"], bonus: 50 },
  { phrases: ["print on demand", "sell shirts", "custom products"], names: ["Printful", "Printify"], bonus: 50 },
  { phrases: ["dropshipping", "drop shipping"], names: ["Zendrop", "Shopify"], bonus: 50 },
  { phrases: ["build a website", "make a website", "website without coding", "website no code", "no code website", "landing page"], names: ["Webflow", "Wix", "Squarespace", "Systeme.io"], bonus: 50 },
  { phrases: ["grammar", "proofread", "fix my writing", "improve my writing", "write better"], names: ["Grammarly", "ChatGPT", "Claude"], bonus: 45 },
  { phrases: ["homework", "study", "studying", "school help"], names: ["Khan Academy", "Quizlet", "ChatGPT", "Wolfram Alpha"], bonus: 40 },
  { phrases: ["automate", "automation", "repetitive tasks", "connect apps"], names: ["Zapier", "Make", "Systeme.io"], bonus: 50 },
  { phrases: ["manage my business", "manage business", "crm", "sales leads"], names: ["HubSpot", "Systeme.io", "Salesforce"], bonus: 40 },
  { phrases: ["online store", "sell online", "ecommerce", "e-commerce"], names: ["Shopify", "Systeme.io", "Squarespace", "Wix"], bonus: 50 },
  { phrases: ["accounting", "bookkeeping", "invoice", "expenses"], names: ["QuickBooks", "FreshBooks"], bonus: 50 },
  { phrases: ["social media", "schedule posts", "social posts"], names: ["Buffer", "Hootsuite", "Canva"], bonus: 45 },
  { phrases: ["email marketing", "newsletter", "mailing list"], names: ["Mailchimp", "Brevo", "Kit", "Systeme.io"], bonus: 45 },
  { phrases: ["schedule meeting", "book meeting", "appointment scheduling"], names: ["Calendly"], bonus: 55 },
  { phrases: ["cloud storage", "share files", "file sharing"], names: ["Dropbox", "Google Workspace", "Microsoft 365"], bonus: 45 },
  { phrases: ["write code", "coding", "programming", "code editor"], names: ["Visual Studio Code", "GitHub", "GitLab", "ChatGPT", "Claude"], bonus: 40 },
  { phrases: ["mod a game", "mod games", "game mod", "game mods", "game modding", "ai game modding", "minecraft mod", "terraria mod", "gta mod"], names: ["Universal Modder"], bonus: 70 }
];

const stopWords = new Set([
  "a", "an", "and", "are", "can", "do", "for", "help", "i", "is", "it",
  "me", "my", "need", "of", "please", "something", "that", "the", "to",
  "tool", "tools", "want", "with", "without"
]);

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textHasTerm(text, term) {
  const haystack = ` ${normalizeSearchText(text)} `;
  const needle = ` ${normalizeSearchText(term)} `;
  return haystack.includes(needle);
}

function getQueryTerms(query) {
  const normalized = normalizeSearchText(query);
  const words = normalized
    .split(" ")
    .filter(word => word.length > 1 && !stopWords.has(word));

  const expanded = new Set(words);
  const matchedIntents = new Set();

  Object.entries(searchIntents).forEach(([intent, phrases]) => {
    const matched = phrases.some(phrase => {
      const normalizedPhrase = normalizeSearchText(phrase);
      return normalized.includes(normalizedPhrase);
    });

    if (matched) {
      matchedIntents.add(intent);
      expanded.add(intent);
    }
  });

  return {
    normalized,
    terms: [...expanded],
    matchedIntents: [...matchedIntents]
  };
}

function scoreTool(tool, query) {
  const { normalized, terms, matchedIntents } = getQueryTerms(query);

  if (!normalized) return 0;

  const name = normalizeSearchText(tool.name);
  const category = normalizeSearchText(tool.cat);
  const description = normalizeSearchText(tool.desc);
  const needs = normalizeSearchText((tool.needs || []).join(" "));

  let score = 0;
  let strongMatches = 0;

  // Exact product searches stay strongest.
  if (name === normalized) {
    score += 120;
    strongMatches += 2;
  } else if (name.includes(normalized) && normalized.length >= 3) {
    score += 70;
    strongMatches += 1;
  }

  terms.forEach(term => {
    if (textHasTerm(name, term)) {
      score += 24;
      strongMatches += 1;
    }
    if (textHasTerm(needs, term)) {
      score += 18;
      strongMatches += 1;
    }
    if (textHasTerm(category, term)) {
      score += 10;
      strongMatches += 1;
    }
    if (textHasTerm(description, term)) {
      score += 4;
    }
  });

  // An intent matching a declared tool need is more meaningful than a
  // coincidental description match.
  matchedIntents.forEach(intent => {
    if (textHasTerm(needs, intent)) {
      score += 20;
      strongMatches += 1;
    }
    if (textHasTerm(category, intent)) {
      score += 12;
      strongMatches += 1;
    }
  });

  // Apply curated bonuses for common natural-language jobs.
  taskRules.forEach(rule => {
    const phraseMatched = rule.phrases.some(phrase =>
      normalized.includes(normalizeSearchText(phrase))
    );

    if (phraseMatched && rule.names.includes(tool.name)) {
      score += rule.bonus;
      strongMatches += 2;
    }
  });

  // Weak description-only coincidences should not become search results.
  if (strongMatches === 0 && score < 12) return 0;

  return score;
}

function render() {
  const rawQuery = (search.value || "").trim();
  const q = searchSubmitted ? rawQuery : "";
  const toolsHeading = document.querySelector("#toolsHeading");
  const toolsDescription = document.querySelector("#toolsDescription");

  let list;

  if (!q) {
    list = tools.map(tool => ({ tool, score: 0 }));
  } else {
    list = tools
      .map(tool => ({ tool, score: scoreTool(tool, q) }))
      .filter(result => result.score >= 12);
  }

  if (sort.value === "name") {
    list.sort((a, b) => a.tool.name.localeCompare(b.tool.name));
  } else if (q) {
    list.sort((a, b) =>
      b.score - a.score ||
      Number(Boolean(b.tool.featured)) - Number(Boolean(a.tool.featured)) ||
      a.tool.name.localeCompare(b.tool.name)
    );
  } else {
    list.sort((a, b) =>
      Number(Boolean(b.tool.featured)) -
      Number(Boolean(a.tool.featured))
    );
  }

  const fragment = document.createDocumentFragment();

  list.forEach(({ tool }) => {
    fragment.appendChild(createToolCard(tool));
  });

  grid.replaceChildren(fragment);
  empty.hidden = list.length > 0;

  if (toolsHeading && toolsDescription) {
    if (q && list.length > 0) {
      toolsHeading.textContent = `Best matches for “${q}”`;
      toolsDescription.textContent = `${list.length} ${list.length === 1 ? "tool" : "tools"} ranked by how closely they match what you’re looking for.`;
    } else if (q) {
      toolsHeading.textContent = "We couldn’t find a strong match.";
      toolsDescription.textContent = `No strong matches for “${q}”. Try a tool name, category, or describe what you want to do.`;
    } else {
      toolsHeading.textContent = "Tools worth discovering.";
      toolsDescription.textContent = "Explore software for work, school, business, creativity, communication, development, and everyday productivity.";
    }
  }
}
function showSearchResults() {
  searchSubmitted = true;
  render();

  if ((search.value || "").trim()) {
    document.querySelector("#tools")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// Typing should not replace the directory with an error state. Results are
// evaluated only after the visitor explicitly submits the search.
search.addEventListener("input", () => {
  searchSubmitted = false;
  render();
});

search.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    showSearchResults();
  }
});

document.querySelector("#searchButton")?.addEventListener("click", showSearchResults);

sort.addEventListener("change", render);

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {
    search.value = button.dataset.category || "";
    searchSubmitted = true;
    render();
    document.querySelector("#tools").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll("[data-search-suggestion]").forEach(button => {
  button.addEventListener("click", () => {
    search.value = button.dataset.searchSuggestion || "";
    showSearchResults();
  });
});

render();
renderTrendingTools();


/* =========================================================
   HOMEPAGE NEWS
   ========================================================= */

const homeNewsGrid = document.querySelector("#homeNewsGrid");
const homeNewsStatus = document.querySelector("#homeNewsStatus");

function safeNewsUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function formatNewsDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function createHomeNewsCard(story) {
  const article = document.createElement("article");
  article.className = "news-card home-news-card";

  const meta = document.createElement("div");
  meta.className = "news-meta";

  const category = document.createElement("span");
  category.className = "news-category";
  category.textContent = story.category || "News";

  const source = document.createElement("span");
  source.className = "news-source";
  source.textContent = story.source || "Source";

  meta.append(category, source);

  const heading = document.createElement("h3");
  heading.className = "news-title";
  heading.textContent = story.title || "Untitled story";

  const summary = document.createElement("p");
  summary.className = "news-summary";
  summary.textContent =
    story.summary || "Read the original story for more information.";

  const bottom = document.createElement("div");
  bottom.className = "news-bottom";

  const date = document.createElement("time");
  date.className = "news-date";

  const formattedDate = formatNewsDate(story.published);

  if (formattedDate) {
    date.textContent = formattedDate;
    date.dateTime = story.published;
  }

  const link = document.createElement("a");
  link.className = "news-link";
  link.textContent = "Read original ↗";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const destination = safeNewsUrl(story.url);

  if (destination) {
    link.href = destination;
  } else {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
  }

  bottom.append(date, link);
  article.append(meta, heading, summary, bottom);

  return article;
}

async function loadHomeNews() {
  if (!homeNewsGrid || !homeNewsStatus) {
    return;
  }

  try {
    const response = await fetch("news.json?v=20261004-2", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Unable to load homepage news.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid homepage news feed.");
    }

    const validStories = data
      .filter(story => {
        return (
          story &&
          typeof story.title === "string" &&
          typeof story.category === "string" &&
          typeof story.url === "string"
        );
      })
      .sort((a, b) => {
        return (
          new Date(b.published).getTime() -
          new Date(a.published).getTime()
        );
      });

    const externalStories = validStories.filter(
      story => story.source !== "NOVLIRI"
    );

    const homepageStories = (
      externalStories.length > 0 ? externalStories : validStories
    ).slice(0, 6);

    const fragment = document.createDocumentFragment();

    homepageStories.forEach(story => {
      fragment.appendChild(createHomeNewsCard(story));
    });

    homeNewsGrid.replaceChildren(fragment);

    if (homepageStories.length === 0) {
      homeNewsStatus.textContent =
        "Current stories are temporarily unavailable.";
      homeNewsStatus.hidden = false;
    } else {
      homeNewsStatus.hidden = true;
    }
  } catch (error) {
    console.error("NOVLIRI homepage news:", error);

    homeNewsGrid.replaceChildren();
    homeNewsStatus.textContent =
      "Current stories are temporarily unavailable. Please try again later.";
    homeNewsStatus.hidden = false;
  }
}

loadHomeNews();
