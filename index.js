import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readStoredCredential } from "@earendil-works/pi-coding-agent";
import { copilotWindows, openAIWindows, remainingStatus } from "./usage.js";

const CACHE_PATH = fileURLToPath(new URL("./cache.json", import.meta.url));
const STATUS_KEY = "subscription-status";
const REFRESH_MS = 10 * 60 * 1000;
let cache = {};

async function loadCache() {
  try {
    const value = JSON.parse(await readFile(CACHE_PATH, "utf8"));
    if (value && typeof value === "object") cache = value;
  } catch {}
}

function saveCache() {
  return writeFile(CACHE_PATH, JSON.stringify(cache), { mode: 0o600 }).catch(() => {});
}

function accountId(token) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url"))
      ?.["https://api.openai.com/auth"]?.chatgpt_account_id;
  } catch {}
}

async function json(url, headers) {
  const response = await fetch(url, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchOpenAI(ctx) {
  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
  if (!auth.ok || !auth.apiKey) return [];
  const id = accountId(auth.apiKey);
  return openAIWindows(await json("https://chatgpt.com/backend-api/wham/usage", {
    Authorization: `Bearer ${auth.apiKey}`,
    Accept: "application/json",
    ...(id ? { "ChatGPT-Account-Id": id } : {}),
  }));
}

async function fetchCopilot() {
  const credential = readStoredCredential("github-copilot");
  const token = credential?.refresh || credential?.access;
  if (!token) return [];
  return copilotWindows(await json("https://api.github.com/copilot_internal/user", {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }));
}

function provider(ctx) {
  return ctx.model?.provider === "openai-codex" || ctx.model?.provider === "github-copilot"
    ? ctx.model.provider
    : undefined;
}

export default function (pi) {
  let timer;
  let activeCtx;
  let updating = false;

  function render(ctx) {
    const current = provider(ctx);
    const snapshot = current && cache[current];
    ctx.ui.setStatus(STATUS_KEY, snapshot ? remainingStatus(snapshot.windows) || undefined : undefined);
  }

  async function update(ctx) {
    const current = provider(ctx);
    if (!current || updating) return render(ctx);
    const snapshot = cache[current];
    if (snapshot && Date.now() - snapshot.fetchedAt < REFRESH_MS) return render(ctx);
    updating = true;
    try {
      const windows = current === "openai-codex" ? await fetchOpenAI(ctx) : await fetchCopilot();
      cache[current] = { fetchedAt: Date.now(), windows };
      await saveCache();
    } catch {} finally {
      updating = false;
    }
    render(activeCtx ?? ctx);
    if (activeCtx && provider(activeCtx) !== current) void update(activeCtx);
  }

  pi.on("session_start", async (_event, ctx) => {
    activeCtx = ctx;
    await loadCache();
    render(ctx);
    void update(ctx);
    timer = setInterval(() => {
      if (activeCtx) {
        render(activeCtx);
        void update(activeCtx);
      }
    }, 60_000);
  });

  pi.on("model_select", async (_event, ctx) => {
    activeCtx = ctx;
    render(ctx);
    void update(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    activeCtx = ctx;
    void update(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    clearInterval(timer);
    timer = undefined;
    activeCtx = undefined;
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });
}
