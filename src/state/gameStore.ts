/**
 * 游戏状态管理（useReducer）
 * 完整历史轨迹从第一版起就被记录，供未来 LLM 上下文使用。
 */
import { resetEraPool } from "@/game/eras";
import { advanceWorld, createInitialWorld, isGameOver } from "@/game/worldEngine";
import { RuleBasedEndingProvider } from "@/game/ending/ruleEnding";
import type { EndingResult, GameHistory, TurnDecision, WorldState } from "@/game/types";

// ── 游戏阶段 ──────────────────────────────────────────────
export type GamePhase =
  | "intro"       // 开始界面
  | "decision"    // 决策阶段（限时 60s）
  | "sleep"       // 沉睡过渡（LLM 缓冲）
  | "game_over"   // 民心归零失败
  | "ending";     // 主动全体解冻结局

/** 最大睡眠次数，耗尽后只能全体解冻 */
export const MAX_SLEEPS = 7;

// ── 状态 ──────────────────────────────────────────────────
export interface GameState {
  phase: GamePhase;
  world: WorldState;
  history: GameHistory;
  /** 上一轮的叙述（苏醒界面使用） */
  latestNarrative: { title: string; text: string; truthText?: string }[];
  scoutReturnLast: number;
  ending?: EndingResult;
  /** 结局是否正在等待 LLM 生成覆盖 */
  endingPending: boolean;
  sleepMessage: string;
  trustWarning: boolean;
  /** 已完成的睡眠次数 */
  sleepCount: number;
}

// ── Actions ───────────────────────────────────────────────
export type GameAction =
  | { type: "START" }
  | { type: "SETTLE_ALL" }
  | { type: "CONTINUE"; decision: TurnDecision }
  | { type: "BACK_TO_DECISION" }
  | { type: "RESET" }
  | { type: "SET_NARRATIVE"; narrative: { title: string; text: string; truthText?: string }[] }
  | { type: "SET_ENDING"; ending: EndingResult };

// ── 初始状态 ──────────────────────────────────────────────
export const initialGameState: GameState = {
  phase: "intro",
  world: createInitialWorld(),
  history: { entries: [] },
  latestNarrative: [],
  scoutReturnLast: 0,
  endingPending: false,
  sleepMessage: "你进入了深度睡眠，思绪万千，不知再睁眼时世界是何模样……",
  trustWarning: false,
  sleepCount: 0,
};

// ── Reducer ───────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case "START":
      return { ...state, phase: "decision" };

    case "SETTLE_ALL": {
      // 全体解冻：将剩余 frozenPop 全部并入 activePop，再结算结局
      const settledWorld: WorldState = {
        ...state.world,
        activePop: state.world.activePop + state.world.frozenPop,
        frozenPop: 0,
      };
      // 规则兜底结局，LLM 生成成功后会通过 SET_ENDING 覆盖
      const ending = new RuleBasedEndingProvider().buildEnding(settledWorld, state.history);
      return { ...state, phase: "ending", world: settledWorld, ending, endingPending: true };
    }

    case "CONTINUE": {
      const newSleepCount = state.sleepCount + 1;
      const turnResult = advanceWorld(state.world, action.decision);
      const newWorld   = turnResult.state;
      const newHistory: GameHistory = {
        entries: [...state.history.entries, turnResult.historyEntry],
      };

      // 民心归零 → game over
      const gameOver = isGameOver(newWorld);

      const trustWarning =
        !gameOver && newWorld.trust > 0 && newWorld.trust < 25;

      const sleepMsg = action.decision.sendScout
        ? "先遣队已出发，载着希望驶入未知的时间长河……"
        : "你重新进入深度睡眠，思绪万千，冷冻舱的低鸣渐渐远去……";

      return {
        ...state,
        phase:           gameOver ? "game_over" : "sleep",
        world:           newWorld,
        history:         newHistory,
        latestNarrative: turnResult.narrative,
        scoutReturnLast: turnResult.scoutReturn,
        sleepMessage:    sleepMsg,
        trustWarning,
        endingPending:   gameOver ? true : state.endingPending,
        sleepCount:      newSleepCount,
      };
    }

    case "BACK_TO_DECISION":
      return { ...state, phase: "decision" };

    case "SET_NARRATIVE":
      return { ...state, latestNarrative: action.narrative };

    case "SET_ENDING":
      return { ...state, ending: action.ending, endingPending: false };

    case "RESET":
      resetEraPool();
      return initialGameState;

    default:
      return state;
  }
}