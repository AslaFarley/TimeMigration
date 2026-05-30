/**
 * LLMEndingProvider
 * 结局判定（success/failure/rebirth）复用 RuleBasedEndingProvider 的规则逻辑，
 * 仅用 LLM 生成"移民文明苏醒后约 1000 年的发展史"叙事文本。
 * 失败时回退到规则实现。
 */
import type { EndingResult, GameHistory, WorldState } from "../types";
import { chatJSON } from "../llm/client";
import { RuleBasedEndingProvider } from "./ruleEnding";

interface LLMEndingJSON {
  title: string;
  text: string;
  timeline: string[];
}

function format(v: number) {
  return Math.round(v).toString();
}

export async function buildLLMEnding(
  state: WorldState,
  history: GameHistory,
): Promise<EndingResult> {
  // 先用规则实现拿到判定 + 兜底
  const ruleResult = new RuleBasedEndingProvider().buildEnding(state, history);

  try {
    const historySummary = history.entries
      .map(
        (e) =>
          `第${e.turn}代·${e.eraName} 沉睡${e.sleepingYears}年 先遣归队${e.scoutReturn}人 活跃人口${format(e.activeBefore)}→${format(e.activeAfter)}`,
      )
      .join("；");

    const userPrompt = [
      `规则判定结果：${ruleResult.outcome}`,
      `定居时代：${state.era.name}。`,
      `最终状态：活跃人口 ${format(state.activePop)}、冷冻人口 ${format(state.frozenPop)}、`,
      `承载力 ${format(state.capacity)}、`,
      `宜居度 ${format(state.habitability)}、接纳度 ${format(state.acceptance)}、`,
      `科技 ${format(state.tech)}、民心 ${format(state.trust)}、`,
      `是否建交：${state.allianceFormed ? "是" : "否"}。`,
      `整局历程：${historySummary || "（起始时代）"}`,
      "请据此续写这支移民文明苏醒后约 1000 年的发展史。",
    ].join("\n");

    const result = await chatJSON<LLMEndingJSON>(
      [
        {
          role: "system",
          content:
            "你为科幻游戏《时间移民》生成「移民文明苏醒后约 1000 年的发展史」。" +
            "这是开放式结局，不打分、不评级，由玩家自行解读成败。" +
            "只输出 JSON：{\"title\":\"...\",\"text\":\"...\",\"timeline\":[\"条目1\",\"条目2\",...]}，全部中文。" +
            "text 为 150-250 字的史诗式叙述；timeline 为 4-7 条编年要点。",
        },
        { role: "user", content: userPrompt },
      ],
      { temperature: 1.0, maxTokens: 800, timeoutMs: 20000 },
    );

    if (!result || !result.title || !result.text || !Array.isArray(result.timeline)) {
      throw new Error("LLM 结局 JSON 缺失字段");
    }

    return {
      outcome: ruleResult.outcome,
      title: result.title,
      text: result.text,
      timeline: result.timeline.filter(Boolean),
    };
  } catch (e) {
    console.warn("[LLM Ending] 生成失败，回退规则结局:", e);
    return ruleResult;
  }
}