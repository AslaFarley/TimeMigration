import type { NarrativeProvider } from "./provider";
import type { WorldState } from "../types";
import { buildNarrative } from "./noise";

/**
 * 第一版叙述提供器：从手写种子库生成带噪声的叙述文本。
 * 未来可替换为 LLMProvider，接口不变。
 */
export class SeedLibraryProvider implements NarrativeProvider {
  getNarrative(state: WorldState, scoutReturn = 0) {
    return buildNarrative(state, scoutReturn);
  }
}
