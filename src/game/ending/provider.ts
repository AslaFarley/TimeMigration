import type { EndingResult, WorldState } from "../types";

/**
 * EndingProvider 接口
 * 第一版实现：RuleBasedEndingProvider（规则化成功/失败 + 定性描述）
 * 未来可替换为 LLMEndingProvider，生成"苏醒后千年发展史"叙事
 */
export interface EndingProvider {
  buildEnding(state: WorldState, history: { entries: unknown[] }): EndingResult;
}
