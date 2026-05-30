import type { NarrativeLine, WorldState } from "../types";

/**
 * NarrativeProvider 接口
 * 第一版实现：SeedLibraryProvider（种子库 + 受控噪声）
 * 未来可替换为 LLMProvider（后端代理）
 */
export interface NarrativeProvider {
  getNarrative(state: WorldState): NarrativeLine[];
}
