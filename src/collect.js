// Couche COLLECTE : déterministe, 0 token LLM.
import Parser from "rss-parser";
import { RSS_SOURCES, GOOGLE_NEWS_QUERIES, GITHUB_REPOS, HN_QUERIES } from "./sources.js";

const parser = new Parser({ timeout: 15000 });
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 7);
const SINCE = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
const UA = "ai-weekly-digest/1.0 (personal automation)";

const recent = (ts) => typeof ts === "number" && !Number.isNaN(ts) && ts >= SINCE;
const clip = (s, n = 280) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

async function collectRss() {
  const out = [];
  for (const s of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(s.url);
      for (const item of feed.items || []) {
        const ts = item.isoDate ? Date.parse(item.isoDate) : (item.pubDate ? Date.parse(item.pubDate) : NaN);
        if (!recent(ts)) continue;
        out.push({ title: item.title || "(sans titre)", url: item.link, source: s.name,
          category: s.category, date: new Date(ts).toISOString(),
          summary: clip(item.contentSnippet || item.content), score: s.lowPriority ? 1 : 5 });
      }
    } catch (e) { console.warn(`[rss] ${s.name} échec: ${e.message}`); }
  }
  return out;
}

async function collectGoogleNews() {
  const out = [];
  for (const q of GOOGLE_NEWS_QUERIES) {
    try {
      const query = `${q.query} when:${WINDOW_DAYS}d`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(url);
      let n = 0;
      for (const item of feed.items || []) {
        const ts = item.isoDate ? Date.parse(item.isoDate) : (item.pubDate ? Date.parse(item.pubDate) : NaN);
        if (!recent(ts)) continue;
        if (n++ >= 8) break;
        out.push({ title: item.title || "(sans titre)", url: item.link, source: `Google News · ${q.query}`,
          category: q.category, date: new Date(ts).toISOString(),
          summary: clip(item.contentSnippet || item.content, 160), score: 4 });
      }
    } catch (e) { console.warn(`[gnews] "${q.query}" échec: ${e.message}`); }
  }
  return out;
}

async function collectGithub() {
  const out = [];
  const headers = { "User-Agent": UA, Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (const r of GITHUB_REPOS) {
    try {
      const res = await fetch(`https://api.github.com/repos/${r.repo}/releases?per_page=5`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      for (const rel of await res.json()) {
        const ts = Date.parse(rel.published_at);
        if (!recent(ts) || rel.draft) continue;
        out.push({ title: `${r.repo} ${rel.tag_name || rel.name || ""}`.trim(), url: rel.html_url,
          source: `GitHub · ${r.repo}`, category: r.category, date: new Date(ts).toISOString(),
          summary: clip(rel.body, 220), score: rel.prerelease ? 2 : 4 });
      }
    } catch (e) { console.warn(`[github] ${r.repo} échec: ${e.message}`); }
  }
  return out;
}

async function collectHn() {
  const out = [];
  const sinceSec = Math.floor(SINCE / 1000);
  for (const q of HN_QUERIES) {
    try {
      // Algolia ne filtre plus sur points -> on filtre la date cote API, les points cote JS.
      const nf = encodeURIComponent(`created_at_i>${sinceSec}`);
      const url = `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=50&query=${encodeURIComponent(q.query)}&numericFilters=${nf}`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const h of data.hits || []) {
        if ((h.points || 0) < q.minPoints) continue;
        out.push({ title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: `HN (${h.points} pts)`, category: q.category,
          date: new Date(h.created_at_i * 1000).toISOString(), summary: "",
          score: Math.min(10, 4 + Math.floor(h.points / 150)) });
      }
    } catch (e) { console.warn(`[hn] "${q.query}" echec: ${e.message}`); }
  }
  return out;
}

const BOOST = /\b(launch|launches|launched|launching|introduc|unveil|announc|release|released|debut|ships?|now available|open[- ]?source|open[- ]?weight|rolls out|general availability|available now)\b/i;
const VERSIONY = /\b(GPT-?\d|Claude\s|Gemini\s|Llama\s|Sora\s?\d|v\d+(\.\d+)+|\b\d+B\b)\b/;
const NOISE = /\b(best|top\s\d|vs\.?|versus|tips|how to|guide|tutorial|review|roundup|alternatives?|cheapest|things you|explained|what is|beginner)\b/i;
function keywordDelta(title) {
  let d = 0;
  if (BOOST.test(title)) d += 3;
  if (VERSIONY.test(title)) d += 2;
  if (NOISE.test(title)) d -= 4;
  return d;
}

const STOP = new Set("the a an of to in on for and or with from your you out new now ai model models llm que les des une pour avec sur dans".split(" "));
function sigTokens(title) {
  return new Set((title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
}
function overlap(a, b) { let n = 0; for (const w of a) if (b.has(w)) n++; return n; }

function clusterAndBoost(items) {
  for (const it of items) it.score += keywordDelta(it.title || "");
  items.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
  const clusters = [];
  for (const it of items) {
    const t = sigTokens(it.title);
    let best = null, bestOv = 0;
    for (const c of clusters) {
      const ov = overlap(t, c.tokens);
      const ratio = ov / Math.max(1, Math.min(t.size, c.tokens.size));
      if (ov >= 2 && ratio >= 0.34 && ov > bestOv) { bestOv = ov; best = c; }
    }
    if (best) best.count++;
    else clusters.push({ rep: it, tokens: t, count: 1 });
  }
  for (const c of clusters) {
    c.rep.score += Math.min(8, (c.count - 1) * 2);
    c.rep.corroboration = c.count;
  }
  return clusters.map((c) => c.rep);
}

function selectByQuota(items, cap, quotas) {
  items.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
  const picked = [], seen = new Set();
  for (const cat of Object.keys(quotas)) {
    let n = 0;
    for (const it of items) {
      if (it.category !== cat || seen.has(it)) continue;
      picked.push(it); seen.add(it);
      if (++n >= quotas[cat]) break;
    }
  }
  for (const it of items) { if (picked.length >= cap) break; if (!seen.has(it)) { picked.push(it); seen.add(it); } }
  return picked.slice(0, cap).sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
}

export async function collectAll() {
  const batches = await Promise.all([collectRss(), collectGoogleNews(), collectGithub(), collectHn()]);
  const items = clusterAndBoost(batches.flat());
  const CAP = Number(process.env.MAX_ITEMS || 120);
  const byCat = {};
  for (const it of items) byCat[it.category] = (byCat[it.category] || 0) + 1;
  const topCorro = [...items].sort((a, b) => (b.corroboration || 1) - (a.corroboration || 1))[0];
  console.log(`[collect] ${items.length} sujets uniques — ia:${byCat.ia || 0} media:${byCat.media || 0} design:${byCat.design || 0} (cap ${CAP})`);
  if (topCorro) console.log(`[collect] sujet le + corroboré : "${(topCorro.title || "").slice(0, 60)}" (${topCorro.corroboration} sources)`);
  return selectByQuota(items, CAP, { media: 18, design: 12, ia: 999 });
}
