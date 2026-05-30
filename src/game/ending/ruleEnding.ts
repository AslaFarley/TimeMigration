import type { EndingProvider } from "./provider";
import type { EndingResult, GameHistory, WorldState } from "../types";

/**
 * 规则化结局实现（第一版）
 * 根据最终世界状态判定成功/失败/重建，输出定性描述。
 * 不给数字评分，避免确定性结局感。
 *
 * 未来替换为 LLMEndingProvider 时，将整局历史轨迹作为上下文传入，
 * 生成"移民文明苏醒后 1000 年发展历程"的开放叙事。
 * history 参数已在接口中预留，第一版仅做简单引用。
 */
export class RuleBasedEndingProvider implements EndingProvider {
  buildEnding(state: WorldState, history: GameHistory): EndingResult {
    const turns = history.entries.length;

    // ── 优先判定：洪荒重建 ──
    if (state.era.id === "primordial") {
      const totalPop = state.activePop + state.frozenPop;
      if (totalPop >= 8000 && state.allianceFormed) {
        return {
          outcome: "rebirth",
          title: "洪荒重启——文明重生",
          text:
            `在人类文明灭绝之后，你携带 ${Math.round(totalPop).toLocaleString()} 名幸存者从冷冻中苏醒。` +
            `曾经的建交经验让你们学会了与自然共处。没有科技、没有城市，` +
            `但你们拥有知识与希望。人类文明在这片原始地球上重新点燃了第一簇火。`,
          timeline: [
            `· 共经历 ${turns} 个时代`,
            `· 最终抵达：洪荒重启`,
            `· 幸存人口：${Math.round(totalPop).toLocaleString()}`,
            `· 已与原住文明建交，继承了文明重建的智慧`,
          ``,
        ],
        };
      }
      // 不够条件 → 勉强存活但算不上成功
      return {
        outcome: "failure",
        title: "洪荒重启——微弱余烬",
        text:
          `人类文明已终结，仅剩 ${Math.round(totalPop).toLocaleString()} 人在这片原始地球上挣扎。` +
          `没有建交所积累的文明智慧，重建之路几乎不可能。火种在风中摇曳，随时可能熄灭。`,
        timeline: [
          `· 共经历 ${turns} 个时代`,
          `· 最终抵达：洪荒重启`,
          `· 幸存人口：${Math.round(totalPop).toLocaleString()}`,
          `· 未能建交，缺乏重建所需的文化根基`,
        ],
      };
    }

    const activeRatio = state.capacity > 0 ? state.activePop / state.capacity : 0;

    // 成功判定：活跃人口占承载力 35% 以上，且民心未崩溃
    const success = activeRatio >= 0.35 && state.trust >= 20;

    const outcome = success ? "success" : "failure";

    const title = success
      ? `${state.era.name}——文明扎根`
      : `${state.era.name}——迁移失控`;

    const text = success
      ? `经过 ${turns} 次沉睡与抉择，移民文明在这个时代站稳了脚跟。` +
        `约 ${Math.round(state.activePop).toLocaleString()} 人在此定居，` +
        `宜居度 ${Math.round(state.habitability)}、接纳度 ${Math.round(state.acceptance)}。` +
        `未来千年的发展仍不确定，但你已经把人类送上了新的轨道。`
      : `经过 ${turns} 次沉睡，这次定居没有真正稳住。` +
        `活跃人口 ${Math.round(state.activePop).toLocaleString()}，` +
        `民心仅剩 ${Math.round(state.trust)}，承载力缺口或信任危机让迁移计划陷入困境。` +
        `即便如此，故事没有被终结，只是留下了更漫长的疑问。`;

    const timeline: string[] = [
      `· 共经历 ${turns} 个时代`,
      `· 定居时代：${state.era.name}`,
      `· 活跃人口：${Math.round(state.activePop).toLocaleString()}`,
      `· 冷冻人口：${Math.round(state.frozenPop).toLocaleString()}`,
      `· 时代承载力：${Math.round(state.capacity).toLocaleString()}`,
      `· 民心：${Math.round(state.trust)}`,
      `· 宜居度：${Math.round(state.habitability)} / 接纳度：${Math.round(state.acceptance)} / 科技：${Math.round(state.tech)}`,
      ``,
    ];

    return { outcome, title, text, timeline };
  }
}