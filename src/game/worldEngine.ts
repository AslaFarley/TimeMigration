/**
 * 世界状态机
 * 详见 DESIGN.md 第 4 节（人口演化公式）
 */
import { createEra } from "./eras";
import { SeedLibraryProvider } from "./narrative/seedProvider";
import type { GameTurnResult, MissionTarget, TurnDecision, WorldState } from "./types";

// ── 常量 ──────────────────────────────────────────────────
/** 每次派遣的先遣队固定人数 */
const SCOUT_SIZE = 1200;
/** 先遣队任务成功后对目标参数的加成 */
const SCOUT_MISSION_BONUS = 4;
/** 民心预警阈值 */
const TRUST_WARNING = 25;
/** 民心归零即视为失败（由 UI 层判断） */
export const TRUST_FAILURE = 0;

// ── 辅助 ──────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function safeRound(v: number) {
  return Math.max(0, Math.round(v));
}

/**
 * 人口乘子 f(habitability, acceptance, tech)
 * 环境好 → >1（壮大），差 → <1（损耗）
 */
function populationMultiplier(s: WorldState): number {
  const env = (s.habitability + s.acceptance) / 2;   // 0-100
  const techBonus   = (s.tech  / 100) * 0.18;
  const trustBonus  = (s.trust / 100) * 0.08;

  // 超载惩罚
  const overloadPenalty =
    s.activePop > s.capacity
      ? Math.min(0.55, (s.activePop - s.capacity) / s.capacity)
      : 0;

  const raw = 0.35 + env / 120 + techBonus + trustBonus - overloadPenalty;
  return clamp(raw, 0.30, 1.40);
}

/** 先遣队自动选最优任务：改善对人口存活影响最大的参数 */
function pickMissionTarget(s: WorldState): MissionTarget {
  return s.acceptance <= s.habitability ? "acceptance" : "habitability";
}

// ── 初始化 ────────────────────────────────────────────────
export function createInitialWorld(): WorldState {
  const era = createEra(0);
  return {
    eraIndex:      0,
    era,
    habitability:  era.baseHabitability,
    acceptance:    era.baseAcceptance,
    tech:          era.baseTech,
    capacity:      era.baseCapacity,
    trust:         era.baseTrust,
    frozenPop:     120000,
    activePop:     0,
    scoutForce:    0,
    sleepingYears: 1,
  };
}

// ── 核心演化 ──────────────────────────────────────────────
/**
 * 每轮结算：
 *  1) 先遣队归队 + 注入 activePop
 *  2) activePop *= f(...)
 *  3) 先遣队任务效果 → 作用于下一时代参数
 *  4) 推进到下一时代（混合当前值与新时代基准）
 *  5) 超载 → 渐进损耗 trust
 *  6) 生成叙述 + 历史条目
 */
export function advanceWorld(
  state: WorldState,
  decision: TurnDecision,
): GameTurnResult {
  const narrativeProvider = new SeedLibraryProvider();
  const activeBefore = state.activePop;

  // 派遣先遣队（从 frozenPop 扣减）
  const scoutSent = decision.sendScout
    ? Math.min(SCOUT_SIZE, state.frozenPop)
    : 0;

  const next: WorldState = { ...state, sleepingYears: decision.sleepingYears };

  if (scoutSent > 0) {
    next.frozenPop  = safeRound(next.frozenPop - scoutSent);
    next.scoutForce = safeRound(next.scoutForce + scoutSent);
  }

  // ① 先遣队存活并归队
  const f = populationMultiplier(next);
  const scoutReturn = safeRound(next.scoutForce * f);
  next.scoutForce = 0;
  next.activePop  = safeRound(next.activePop + scoutReturn);

  // ② 已解冻人口随时代演化
  next.activePop = safeRound(next.activePop * f);
  // 硬性上限：不超过承载力 2 倍
  next.activePop = Math.min(next.activePop, next.capacity * 2);

  // ③ 先遣队任务效果（作用于推进后的时代参数）
  const missionTarget = pickMissionTarget(next);

  // ④ 推进到下一时代
  const steps = Math.max(1, Math.round(decision.sleepingYears / 5));
  const newEraIndex = state.eraIndex + steps;
  const newEra = createEra(newEraIndex);
  next.eraIndex = newEraIndex;
  next.era      = newEra;

  // 混合：新时代基准与当前值各占一定权重
  next.habitability = clamp(next.habitability * 0.4 + newEra.baseHabitability * 0.6, 0, 100);
  next.acceptance   = clamp(next.acceptance   * 0.4 + newEra.baseAcceptance   * 0.6, 0, 100);
  next.tech         = clamp(next.tech         * 0.4 + newEra.baseTech         * 0.6, 0, 100);
  next.capacity     = safeRound(next.capacity * 0.4 + newEra.baseCapacity     * 0.6);
  next.trust        = clamp(next.trust        * 0.4 + newEra.baseTrust        * 0.6, 0, 100);

  // ③ 先遣队任务效果（叠加在混合后的新时代上）
  if (scoutSent > 0) {
    if (missionTarget === "acceptance") {
      next.acceptance = clamp(next.acceptance + SCOUT_MISSION_BONUS, 0, 100);
    } else {
      next.habitability = clamp(next.habitability + SCOUT_MISSION_BONUS, 0, 100);
    }
  }

  // ⑤ 超载 → 渐进损耗 trust + 轻微人口损耗
  if (next.activePop > next.capacity) {
    const overload = next.activePop - next.capacity;
    const trustDrain = Math.min(12, overload / 5000);
    next.trust     = clamp(next.trust - trustDrain, 0, 100);
    next.activePop = safeRound(next.activePop - overload * 0.06);
  }

  // 低民心持续衰减（预警效果）
  if (next.trust < TRUST_WARNING) {
    next.trust = clamp(next.trust - 2.5, 0, 100);
  }

  // ⑥ 叙述
  const narrative = narrativeProvider.getNarrative(next, scoutReturn);

  const historyEntry = {
    turn:          state.eraIndex + 1,
    eraName:       next.era.name,
    sleepingYears: decision.sleepingYears,
    decision:      decision.settleAll ? ("settle" as const) : ("continue" as const),
    sentScout:     scoutSent > 0,
    scoutReturn,
    activeBefore,
    activeAfter:   next.activePop,
    truthSnapshot: {
      habitability: next.habitability,
      acceptance:   next.acceptance,
      tech:         next.tech,
      capacity:     next.capacity,
      trust:        next.trust,
    },
    narrative: narrative[0]?.text ?? "",
  };

  return { state: next, narrative, historyEntry, scoutReturn };
}

/** 判断当前状态是否触发失败 */
export function isGameOver(state: WorldState): boolean {
  return state.trust <= TRUST_FAILURE;
}

/** 判断当前状态是否需要给出预警 */
export function hasTrustWarning(state: WorldState): boolean {
  return state.trust > TRUST_FAILURE && state.trust < TRUST_WARNING;
}
