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

/**
 * 生成"先遣队情报"（文学化描述，不暴露具体世界参数数值）
 * 情报反映的是下一次苏醒年代（即先遣队实际经历的时代）的真实环境。
 */
function buildScoutIntel(state: WorldState, scoutReturn: number): string | undefined {
  if (state.scoutForce <= 0 && scoutReturn <= 0) return undefined;
  const sentCount = state.scoutForce + scoutReturn;
  const returnPct = sentCount > 0
    ? Math.round((scoutReturn / sentCount) * 100)
    : 0;

  // 模糊的文学化描述，不包含具体数值
  const survivalDesc =
    returnPct >= 80 ? "大部分成员成功穿越时间屏障，带回珍贵见闻。"
    : returnPct >= 50 ? "约半数成员存活归来，带回前方的零散信息。"
    : returnPct >= 30 ? "仅少数成员狼狈返回，氛围凝重。"
    : "极少数成员艰难生还，沉默中传递着不祥的预感。";

  // 环境印象（模糊定性，不报数值）
  const envImpression = state.habitability >= 70 ? "环境尚可"
    : state.habitability >= 40 ? "环境险峻"
    : "环境极为严酷";
  const socialImpression = state.acceptance >= 70 ? "原住文明态度友善"
    : state.acceptance >= 40 ? "原住文明态度冷漠"
    : "原住文明充满敌意";

  return `【先遣队内部报告】先遣队从目标时代归来。${survivalDesc}综合印象：${envImpression}，${socialImpression}。`;
}

export function buildNarrative(state: WorldState, scoutReturn = 0): NarrativeLine[] {
  const tone = state.era.tone;
  // 若已识破说谎者，liar 降级为 reliable
  const effectiveTone = (state.liarExposed && tone === "liar") ? "reliable" : tone;
  const eraSeeds = SEED_LIBRARY[state.era.id];
  // 若该时代无种子，回退到 war_aftermath 种子库
  const fallback = SEED_LIBRARY["war_aftermath"];
  const pool = (eraSeeds ?? fallback)![effectiveTone] ?? fallback!.reliable;
  const seed = pick(pool, state.eraIndex + state.sleepingYears);

  // 叙述者风格附注
  const toneNote: Record<typeof effectiveTone, string> = {
    reliable:    "【叙述者：信息来源较为可靠】",
    optimistic:  "【叙述者：乐观倾向，可能夸大有利条件】",
    pessimistic: "【叙述者：悲观倾向，可能低估生存空间】",
    liar:        "【叙述者：信息来源存疑，部分内容可能与实际相反】",
  };

  const liarOverrideNote = (state.liarExposed && tone === "liar")
    ? "（已识破谎言，本次信息已修正）" : "";

  const publicText = `${seed.text} ${toneNote[effectiveTone]}${liarOverrideNote}`;

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