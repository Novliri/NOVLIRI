const directory = globalThis.NOVLIRI_TOOLS || [];
const params = new URLSearchParams(window.location.search);
const requested = (params.get("tool") || "").trim().toLowerCase();
const tool = directory.find(item => item.name.toLowerCase() === requested);
const detail = document.querySelector("#toolDetail");
const missing = document.querySelector("#toolMissing");
if (!tool) {
  missing.hidden = false;
} else {
  detail.hidden = false;
  document.title = `${tool.name} — What it does | NOVLIRI`;
  const meta = document.querySelector('meta[name="description"]');
  const description = `Discover ${tool.name} on NOVLIRI. ${tool.desc}`;
  if (meta) meta.content = description;
  const canonicalUrl = `https://novliri.com/tool.html?tool=${encodeURIComponent(tool.name)}`;
  document.querySelector("#canonicalLink")?.setAttribute("href", canonicalUrl);
  document.querySelector("#ogTitle")?.setAttribute("content", document.title);
  document.querySelector("#ogDescription")?.setAttribute("content", description);
  document.querySelector("#ogUrl")?.setAttribute("content", canonicalUrl);
  document.querySelector("#twitterTitle")?.setAttribute("content", document.title);
  document.querySelector("#twitterDescription")?.setAttribute("content", description);
  document.querySelector("#detailCategory").textContent = tool.cat;
  document.querySelector("#detailName").textContent = tool.name;
  document.querySelector("#detailDescription").textContent = tool.desc;
  document.querySelector("#detailPrice").textContent = tool.price;
  const needs = document.querySelector("#detailNeeds");
  (tool.needs || []).forEach(value => {
    const span = document.createElement("span"); span.className = "tag"; span.textContent = value; needs.appendChild(span);
  });
  const visit = document.querySelector("#detailVisit");
  try {
    const url = new URL(tool.url);
    if (url.protocol !== "https:") throw new Error("Unsupported URL");
    visit.href = url.href;
    visit.rel = tool.affiliate ? "noopener sponsored" : "noopener";
  } catch { visit.removeAttribute("href"); visit.setAttribute("aria-disabled","true"); }
  if (tool.originalProject) visit.firstChild.textContent = "Visit original project ";
  if (tool.thirdParty) {
    const notice = document.querySelector("#detailNotice"); notice.hidden = false;
    notice.textContent = `Third-party project by ${tool.creator || "its respective creator"}. NOVLIRI does not own, operate, or endorse this project. Names and trademarks belong to their respective owners.`;
  }
  if (tool.affiliate) document.querySelector("#affiliateNotice").hidden = false;

  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.desc,
    applicationCategory: tool.cat,
    url: canonicalUrl,
    sameAs: tool.url
  });
  document.head.appendChild(schema);
}