/**
 * LLM Provider 配置
 * 游戏运行时按顺序尝试，自动选用第一个可用的 provider。
 * 生产部署需自备反向代理（apiKey 无法在前端保密）。
 */
export interface LLMProviderConfig {
  name: string;
  model: string;
  baseURL: string;
  apiKey: string;
}

/** 原始 provider 列表（真实 baseURL / apiKey） */
const RAW_PROVIDERS: LLMProviderConfig[] = [
  {
    name: "silicon",
    model: "deepseek-ai/DeepSeek-V4-Flash",
    baseURL: "https://api.siliconflow.cn/v1",
    apiKey: "sk-buljnvhxuchipxidqzyirmashkgckmrbgrnjlglspdallsrl",
  },
  {
    name: "aiping",
    model: "DeepSeek-V4-Flash",
    baseURL: "https://aiping.cn/api/v1",
    apiKey: "QC-cad1caaef95e6e777748b372221941fa-83eb610f51e7320e4cfbb7b62984d1ee",
  },
  {
    name: "qnaigc",
    model: "deepseek/deepseek-v4-flash",
    baseURL: "https://api.qnaigc.com/v1",
    apiKey: "sk-560d71b94d9a1930d9b2c2cc005b0479bc2babf1382c9c9a293e56fc505a02a7",
  },
];

/** DEV 环境下通过 Vite 代理绕过 CORS 的路径映射 */
const DEV_PROXY_MAP: Record<string, string> = {
  silicon: "/llm/silicon/v1",
  aiping: "/llm/aiping/api/v1",
  qnaigc: "/llm/qnaigc/v1",
};

function resolveProviders(): LLMProviderConfig[] {
  // 环境变量覆盖（可选）
  if (import.meta.env.VITE_LLM_PROVIDERS) {
    try {
      return JSON.parse(import.meta.env.VITE_LLM_PROVIDERS) as LLMProviderConfig[];
    } catch {
      console.warn("[LLM Config] VITE_LLM_PROVIDERS 解析失败，使用默认配置");
    }
  }

  // DEV 走代理
  if (import.meta.env.DEV) {
    return RAW_PROVIDERS.map((p) => ({
      ...p,
      baseURL: DEV_PROXY_MAP[p.name] ?? p.baseURL,
    }));
  }

  return RAW_PROVIDERS;
}

/** 最终生效的 provider 列表 */
export const LLM_PROVIDERS: LLMProviderConfig[] = resolveProviders();