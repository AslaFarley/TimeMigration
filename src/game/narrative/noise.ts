/**
 * 受控噪声注入模块
 * 根据叙述者风格（tone）对公开文本注入可控偏差。
 * 矛盾/噪声由代码控制，不依赖 LLM 自由发挥。
 */
import type { NarrativeLine, WorldState } from "../types";
import { SEED_LIBRARY } from "./seeds";

function pick<T>(arr: T[], index: number): T {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

function fmt(value: number) {
  return Math.round(value).toString();
}

/** 生成"先遣队情报"（真实存活率，比公开叙述可靠） */
function buildScoutIntel(state: WorldState, scoutReturn: number): string | undefined {
  if (state.scoutForce <= 0 && scoutReturn <= 0) return undefined;
  const returnPct = state.scoutForce > 0
    ? Math.round((scoutReturn / state.scoutForce) * 100)
    : 0;
  return `【先遣队内部报告】本次归队 ${scoutReturn} 人，存活率约 ${returnPct}%，实测宜居度 ${fmt(state.habitability)}，接纳度 ${fmt(state.acceptance)}。`;
}

export function buildNarrative(state: WorldState, scoutReturn = 0): NarrativeLine[] {
  const tone = state.era.tone;
  // 若已识破说谎者，liar 降级为 reliable
  const effectiveTone = (state.liarExposed && tone === "liar") ? "reliable" : tone;
  const pool = SEED_LIBRARY[state.era.id][effectiveTone];
  const seed = pick(pool, state.eraIndex + state.sleepingYears);

  // 基础生存指数（玩家可见的"综合指标"，带噪声）
  let displayIndex: number;
  switch (effectiveTone) {
    case "optimistic":
      displayIndex = Math.min(99, (state.habitability + state.acceptance + state.tech) / 3 + 18);
      break;
    case "pessimistic":
      displayIndex = Math.max(1, (state.habitability + state.acceptance + state.tech) / 3 - 15);
      break;
    case "liar":
      // 故意反转：低的说高，高的说低
      displayIndex = 100 - (state.habitability + state.acceptance + state.tech) / 3;
      break;
    default:
      displayIndex = (state.habitability + state.acceptance + state.tech) / 3;
  }

  // 叙述者风格附注
  const toneNote: Record<typeof effectiveTone, string> = {
    reliable:    "【叙述者：信息来源较为可靠】",
    optimistic:  "【叙述者：乐观倾向，可能夸大有利条件】",
    pessimistic: "【叙述者：悲观倾向，可能低估生存空间】",
    liar:        "【叙述者：信息来源存疑，部分内容可能与实际相反】",
  };

  const liarOverrideNote = (state.liarExposed && tone === "liar")
    ? "（已识破谎言，本次信息已修正）" : "";

  const publicText = `${seed.text} 综合生存指数约 ${Math.round(displayIndex)}。${toneNote[effectiveTone]}${liarOverrideNote}`;

  // 真值（历史面板显示）
  const allianceNote = state.allianceFormed ? " [已建交·长睡损耗减半]" : "";
  const liarNote = state.liarExposed ? " [已识破谎言·liar降级]" : "";
  const truthText =
    `[真实参数] 宜居度 ${fmt(state.habitability)}，接纳度 ${fmt(state.acceptance)}，` +
    `科技 ${fmt(state.tech)}，承载力 ${fmt(state.capacity)}，民心 ${fmt(state.trust)}。` +
    `参考：${seed.truthHint}${allianceNote}${liarNote}`;

  const lines: NarrativeLine[] = [
    { title: seed.title, text: publicText, truthText },
  ];

  // 先遣队情报（额外条目，比公开叙述可靠）
  const intel = buildScoutIntel(state, scoutReturn);
  if (intel) {
    lines.push({ title: "先遣队情报", text: intel });
  }

  return lines;
}