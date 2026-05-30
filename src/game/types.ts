// ─────────────────────────────────────────────────────────
// 《时间移民》核心数据类型
// 详见 DESIGN.md 第 4/5 节
// ─────────────────────────────────────────────────────────

/** 时代质量分类 */
export type EraQuality = "good" | "neutral" | "bad";

/** 时代类型 */
export type EraType =
  | "war_aftermath"
  | "golden"
  | "war"
  | "ecological_collapse"
  | "tech_singularity"
  | "pseudo_prosperity"
  | "winter"
  | "plague"
  | "revival"
  | "totalitarian"
  | "void"
  | "primordial"
  | "desert_expansion"
  | "flood_refuge"
  | "nomadic_revival"
  | "laboratory_enclave"
  | "digital_utopia"
  | "iron_despotism"
  | "cult_awakening"
  | "trade_renaissance"
  | "seasteading"
  | "underground_arcology"
  | "solar_punk"
  | "genetic_divergence"
  | "info_blackout"
  | "terraforming_dawn"
  | "neo_feudalism"
  | "oceanic_collapse"
  | "forgotten_monolith"
  | "echo_chamber"
  | "nuclear_autumn"
  | "glacier_walkers"
  | "megastructure_ruins"
  | "stellar_exodus";

/**
 * 叙述者风格（影响公开文本的偏差方向）
 * reliable  = 可靠，基本如实
 * optimistic = 夸大好消息
 * pessimistic = 强调代价
 * liar      = 故意与真值矛盾
 */
export type NarrativeTone = "reliable" | "optimistic" | "pessimistic" | "liar";

/** 先遣队改造任务目标 */
export type MissionTarget = "acceptance" | "habitability";

/** 时代配置档案 */
export interface EraProfile {
  id: EraType;
  name: string;
  description: string;
  /** 时代质量：good / neutral / bad */
  quality: EraQuality;
  /** 客观环境好坏（天灾维度），0-100 */
  baseHabitability: number;
  /** 原住文明欢迎度（人祸维度），0-100 */
  baseAcceptance: number;
  /** 科技水平，0-100 */
  baseTech: number;
  /** 人口承载力 */
  baseCapacity: number;
  /** 民心/信任，0-100，归零则失败 */
  baseTrust: number;
  /** 当前时代叙述者风格 */
  tone: NarrativeTone;
}

/** 完整世界状态（每次苏醒的快照） */
export interface WorldState {
  /** 当前在 ERA_ORDER 中的索引 */
  eraIndex: number;
  era: EraProfile;
  habitability: number;
  acceptance: number;
  tech: number;
  capacity: number;
  trust: number;
  /** 剩余冷冻人口（先遣队来源池） */
  frozenPop: number;
  /** 已解冻、在当前时代活跃的人口 */
  activePop: number;
  /** 当前派出在外尚未归队的先遣队人数 */
  scoutForce: number;
  /** 本次睡眠时长（年） */
  sleepingYears: number;
  /** 是否已在友好时代与原住文明建交（永久 buff，长睡损耗减半） */
  allianceFormed: boolean;
  /** 是否已识破说谎型叙述者（永久移除 liar 噪声反转） */
  liarExposed: boolean;
}

/** 叙述面板的一行内容 */
export interface NarrativeLine {
  title: string;
  /** 对玩家展示的叙述文本（含噪声/偏差） */
  text: string;
  /** 真实参数注记（可在历史面板对比） */
  truthText?: string;
}

/** 每轮历史记录条目 */
export interface HistoryEntry {
  turn: number;
  eraName: string;
  sleepingYears: number;
  decision: "settle" | "continue";
  sentScout: boolean;
  scoutReturn: number;
  activeBefore: number;
  activeAfter: number;
  /** 真实参数快照，供未来 LLM 上下文使用 */
  truthSnapshot: Pick<WorldState, "habitability" | "acceptance" | "tech" | "capacity" | "trust">;
  narrative: string;
  /** 本回合是否触发建交 */
  allianceFormedThisTurn: boolean;
  /** 本回合是否触发识破谎言 */
  liarExposedThisTurn: boolean;
  /** 长睡导致的本轮人口流失量 */
  sleepLoss: number;
}

/** 玩家每轮的决策 */
export interface TurnDecision {
  settleAll: boolean;
  sleepingYears: number;
  sendScout: boolean;
}

/** 结局结果（第一版为规则化描述，未来由 LLM 扩写） */
export interface EndingResult {
  outcome: "success" | "failure" | "rebirth";
  title: string;
  text: string;
  /** 结局条目列表（未来扩为千年叙事） */
  timeline: string[];
}

/** 完整历史轨迹（确保未来 LLM 上下文数据现成） */
export interface GameHistory {
  entries: HistoryEntry[];
}

/** worldEngine.advanceWorld 的返回值 */
export interface GameTurnResult {
  state: WorldState;
  narrative: NarrativeLine[];
  historyEntry: HistoryEntry;
  scoutReturn: number;
}