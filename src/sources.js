// Registre des sources, regroupées par verticale. category: "ia" | "media" | "design"

export const RSS_SOURCES = [
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", category: "ia" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ia" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", category: "ia" },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "ia" },
  { name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "ia" },
  { name: "The Verge — AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "ia" },
  { name: "Sidebar", url: "https://sidebar.io/feed.xml", category: "design" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", category: "design" },
  { name: "UX Collective", url: "https://uxdesign.cc/feed", category: "design" },
  // Reddit via RSS (l'API JSON bloquait en 403)
  { name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/top/.rss?t=week", category: "ia" },
  { name: "r/ClaudeAI", url: "https://www.reddit.com/r/ClaudeAI/top/.rss?t=week", category: "outils" },
  // Newsletters qui repèrent les outils et astuces avant la presse (long: on garde le corps du numéro)
  { name: "Ben's Bites", url: "https://www.bensbites.com/feed", category: "outils", long: true },
  { name: "TLDR AI", url: "https://tldr.tech/api/rss/ai", category: "outils", long: true },
  { name: "The Rundown AI", url: "https://www.therundown.ai/feed", category: "outils", long: true },
  { name: "Latent Space", url: "https://www.latent.space/feed", category: "ia", long: true },
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "outils" },
  { name: "Product Hunt — IA", url: "https://www.producthunt.com/feed?category=artificial-intelligence", category: "outils", max: 8 },
];

// Google News RSS : couvre les acteurs sans flux fiable + capte les annonces X/Discord via la presse.
export const GOOGLE_NEWS_QUERIES = [
  // IA / LLM
  { query: "Anthropic Claude", category: "ia" },
  { query: "OpenAI GPT", category: "ia" },
  { query: "Mistral AI model", category: "ia" },
  { query: "Meta Llama AI", category: "ia" },
  { query: "Google Gemini model", category: "ia" },
  // Agents & coding tools
  { query: "AI coding agent Cursor", category: "ia" },
  { query: "AI agents framework LangChain", category: "ia" },
  { query: "Claude Code Devin coding", category: "ia" },
  { query: "\"Claude Code\" skill OR plugin OR MCP", category: "outils" },
  // Modèles déployables
  { query: "Replicate fal AI model", category: "ia" },
  // Photo / Vidéo
  { query: "AI video generation", category: "media" },
  { query: "Runway AI video", category: "media" },
  { query: "Kling AI video", category: "media" },
  { query: "Pika Luma AI video", category: "media" },
  { query: "OpenAI Sora", category: "media" },
  { query: "Midjourney AI image", category: "media" },
  { query: "Adobe Firefly AI", category: "media" },
  { query: "Black Forest Labs Flux image", category: "media" },
  { query: "ElevenLabs AI voice", category: "media" },
  // Design
  { query: "Figma AI design tool", category: "design" },
  { query: "Framer AI website", category: "design" },
  { query: "Vercel v0 AI", category: "design" },
];

export const GITHUB_REPOS = [
  { repo: "ollama/ollama", category: "ia" },
  { repo: "vllm-project/vllm", category: "ia" },
  { repo: "ggml-org/llama.cpp", category: "ia" },
  { repo: "huggingface/transformers", category: "ia" },
  { repo: "langchain-ai/langchain", category: "ia" },
  { repo: "comfyanonymous/ComfyUI", category: "media" },
  { repo: "Wan-Video/Wan2.2", category: "media" },
  { repo: "vercel/next.js", category: "design" },
  { repo: "anthropics/claude-code", category: "outils" },
  { repo: "remotion-dev/remotion", category: "outils" },
];

export const HN_QUERIES = [
  { query: "LLM", category: "ia", minPoints: 100 },
  { query: "language model", category: "ia", minPoints: 100 },
  { query: "AI agent", category: "ia", minPoints: 100 },
  { query: "diffusion model", category: "media", minPoints: 80 },
  { query: "video generation", category: "media", minPoints: 80 },
];

// Projets GitHub qui prennent le plus d'étoiles dans la semaine (là où sortent les outils comme Remotion + Claude Code)
export const GITHUB_TRENDING = { url: "https://github.com/trending?since=weekly", category: "outils", max: 25 };

export const CATEGORY_LABELS = { ia: "IA / LLM", media: "Photo & Vidéo", design: "Design & outils", outils: "Outils à tester" };
