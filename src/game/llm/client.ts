/**
 * LLM 客户端
 * 按顺序尝试 provider，缓存第一个成功的；全部失败则抛错。
 */
import { LLM_PROVIDERS, type LLMProviderConfig } from "./config";

// ── 缓存第一个成功的 provider 索引 ──────────────────────────
let cachedWorkingIndex: number | null = null;

/** 合并 AbortController（任一触发均中断） */
function mergeAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortController {
  const merged = new AbortController();
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) {
      merged.abort(s.reason);
      return merged;
    }
    s.addEventListener(
      "abort",
      () => merged.abort(s.reason),
      { once: true },
    );
  }
  return merged;
}

interface ChatOpts {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  /** 单个 provider 超时 ms（默认 12000） */
  timeoutMs?: number;
}

async function tryProvider(
  provider: LLMProviderConfig,
  messages: { role: string; content: string }[],
  opts: ChatOpts,
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 12000;
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = mergeAbortSignals(opts.signal, timeout);

  const url = `${provider.baseURL}/chat/completions`;
  const body = {
    model: provider.model,
    messages,
    temperature: opts.temperature ?? 0.8,
    max_tokens: opts.maxTokens ?? 600,
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: signal.signal,
  });

  if (!res.ok) {
    throw new Error(
      `[${provider.name}] HTTP ${res.status}: ${await res.text().catch(() => "?")}`,
    );
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error(`[${provider.name}] 空响应`);
  }
  return content;
}

async function tryAllProviders(
  messages: { role: string; content: string }[],
  opts: ChatOpts,
): Promise<string> {
  // 优先用缓存的 provider
  if (cachedWorkingIndex !== null) {
    try {
      const result = await tryProvider(LLM_PROVIDERS[cachedWorkingIndex], messages, opts);
      return result;
    } catch {
      cachedWorkingIndex = null; // 过期
    }
  }

  const errors: string[] = [];
  for (let i = 0; i < LLM_PROVIDERS.length; i++) {
    try {
      const result = await tryProvider(LLM_PROVIDERS[i], messages, opts);
      cachedWorkingIndex = i;
      console.log(`[LLM] 使用 provider: ${LLM_PROVIDERS[i].name}`);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.warn(`[LLM] ${LLM_PROVIDERS[i].name} 失败: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}

/**
 * 发送 chat completion 请求，返回文本。
 * 按顺序尝试 provider，自动选择第一个可用的。
 */
export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: ChatOpts,
): Promise<string> {
  return tryAllProviders(messages, opts ?? {});
}

/**
 * 发送 chat completion 请求，解析为 JSON。
 * 容错：自动去除 markdown 代码块、提取首个 JSON 对象/数组。
 */
export async function chatJSON<T>(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: ChatOpts,
): Promise<T> {
  const raw = await chatCompletion(messages, opts);
  let sanitized = raw.trim();

  // 去除 ```json ... ``` 或 ``` ... ```
  const fence = sanitized.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fence) {
    sanitized = fence[1].trim();
  }

  // 提取首个 {...} 或 [...]
  const firstBrace = sanitized.indexOf("{");
  const firstBracket = sanitized.indexOf("[");
  let start = -1;
  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket >= 0) {
    start = firstBracket;
  }

  if (start >= 0) {
    sanitized = sanitized.slice(start);
  }

  try {
    return JSON.parse(sanitized) as T;
  } catch {
    throw new Error(`LLM 返回内容无法解析为 JSON: ${raw.slice(0, 200)}`);
  }
}