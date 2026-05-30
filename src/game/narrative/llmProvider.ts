/**
 * LLMNarrativeProvider
 * 用 LLM 生成公开叙述的 title/text，保留 noise.ts 规则产出的 truthText / 先遣队情报。
 * 任意异常/超时/解析失败 → 回退到种子库 fallback。
 */
import type { NarrativeLine, WorldState } from "../types";
import { chatJSON } from "../llm/client";
import { buildNarrative } from "./noise";

interface LLMNarrativeJSON {
  title: string;
  text: string;
}

function format(v: number) {
  return Math.round(v).toString();
}

export async function getLLMNarrative(
  state: WorldState,
  scoutReturn: number,
  fallback: NarrativeLine[],
): Promise<NarrativeLine[]> {
  try {
    const effectiveTone =
      state.liarExposed && state.era.tone === "liar"
        ? "reliable"
        : state.era.tone;

    const liarNote = state.liarExposed
      ? "玩家已识破谎言，请如实描写。"
      : "";

    const userPrompt = [
      `时代：${state.era.name}（类型 ${state.era.id}）。`,
      `叙述者风格：${effectiveTone}。`,
      `（仅供你把握真假倾向，不要直接报出具体数值）`,
      `真实参数：宜居度 ${format(state.habitability)}、接纳度 ${format(state.acceptance)}、`,
      `科技 ${format(state.tech)}、承载力 ${format(state.capacity)}、民心 ${format(state.trust)}。`,
      liarNote,
      "请生成本时代的公开叙述。",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await chatJSON<LLMNarrativeJSON>(
      [
        {
          role: "system",
          content:
            "你是科幻文字游戏《时间移民》的时代叙述者。玩家携带冷冻人口在未来不同时代间跳跃迁移。" +
            "请根据给定的「叙述者风格」描写玩家本次苏醒后所见的时代见闻：" +
            "reliable=基本如实、克制；optimistic=夸大有利条件，淡化风险；" +
            "pessimistic=强调代价与危险，低估生存空间；" +
            "liar=故意给出与真实情况相反的印象。" +
            "只输出 JSON：{\"title\":\"简短标题\",\"text\":\"60-120字中文叙述\"}。" +
            "不要直接报出任何具体数值（宜居度/接纳度等只能用文学化描述暗示）。",
        },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.9, maxTokens: 400, timeoutMs: 15000 },
    );

    if (!result || !result.title || !result.text) {
      throw new Error("LLM 返回的叙述 JSON 缺少 title/text");
    }

    // 用 LLM 生成的 title/text 替换第 0 行，保留 truthText 和先遣队情报行
    const merged: NarrativeLine[] = [...fallback];
    if (merged.length > 0) {
      merged[0] = {
        ...merged[0],
        title: result.title,
        text: `${result.text} （由 AI 生成）`,
      };
    }
    return merged;
  } catch (e) {
    console.warn("[LLM Narrative] 生成失败，回退种子叙述:", e);
    return fallback;
  }
}