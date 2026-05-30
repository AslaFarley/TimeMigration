/**
 * 时代池（34种，改为随机抽取 + 保底）
 *
 * 质量分布：
 *   good    × 8  (23.5%)  — 宜居/高接纳/高承载
 *   neutral × 11 (32.4%)  — 中规中矩
 *   bad     × 15 (44.1%)  — 恶劣环境、低信任、liar/pessimistic
 *
 * 抽取规则：
 *   - 第 0 代固定 war_aftermath
 *   - 前 2 次跳转（index 1-2）排除 void / primordial（给缓冲期）
 *   - 若最近 3 代连续 bad，则强制从 good/neutral 池抽取
 *   - 使用确定性的伪随机（基于 eraIndex），保证同一局可复现
 */
import type { EraProfile, EraQuality } from "./types";

type EraDef = {
  era: EraProfile;
  quality: EraQuality;
};

const ERA_DEFS: EraDef[] = [
  // ── GOOD x8 ────────────────────────────────────────────────
  { era: { id: "golden", name: "黄金时代", description: "资源丰沛，秩序稳定，叙述却可能过于乐观。", quality: "good", baseHabitability: 82, baseAcceptance: 78, baseTech: 70, baseCapacity: 120000, baseTrust: 72, tone: "optimistic" }, quality: "good" },
  { era: { id: "revival", name: "复兴纪元", description: "废墟中重新长出秩序，世界缓慢恢复呼吸。", quality: "good", baseHabitability: 66, baseAcceptance: 68, baseTech: 54, baseCapacity: 76000, baseTrust: 66, tone: "reliable" }, quality: "good" },
  { era: { id: "tech_singularity", name: "科技奇点", description: "技术飞跃，规则改写，但人群未必因此安全。", quality: "good", baseHabitability: 74, baseAcceptance: 55, baseTech: 95, baseCapacity: 160000, baseTrust: 60, tone: "reliable" }, quality: "good" },
  { era: { id: "trade_renaissance", name: "贸易复兴", description: "商路重开，文明互通，接纳度空前高涨。", quality: "good", baseHabitability: 70, baseAcceptance: 82, baseTech: 60, baseCapacity: 95000, baseTrust: 68, tone: "optimistic" }, quality: "good" },
  { era: { id: "solar_punk", name: "太阳朋克", description: "清洁能源支配时代，自然与技术和谐共生。", quality: "good", baseHabitability: 85, baseAcceptance: 72, baseTech: 78, baseCapacity: 110000, baseTrust: 74, tone: "reliable" }, quality: "good" },
  { era: { id: "digital_utopia", name: "数字乌托邦", description: "虚拟与现实深度融合，信息透明的理想社会——但有人质疑这是否只是表象。", quality: "good", baseHabitability: 68, baseAcceptance: 75, baseTech: 90, baseCapacity: 135000, baseTrust: 62, tone: "optimistic" }, quality: "good" },
  { era: { id: "terraforming_dawn", name: "造陆黎明", description: "大地复苏，气候被成功改造，人类第一次真正掌握自然。", quality: "good", baseHabitability: 90, baseAcceptance: 60, baseTech: 72, baseCapacity: 145000, baseTrust: 70, tone: "reliable" }, quality: "good" },
  { era: { id: "seasteading", name: "海上城邦", description: "海面都市群取代陆地国界，自由与流动性达到巅峰。", quality: "good", baseHabitability: 64, baseAcceptance: 80, baseTech: 68, baseCapacity: 100000, baseTrust: 65, tone: "reliable" }, quality: "good" },

  // ── NEUTRAL x11 ────────────────────────────────────────────
  { era: { id: "war_aftermath", name: "战后废土", description: "战争刚刚结束，城市沦为废墟，幸存者在残骸中搜寻余烬。秩序尚未重建，一切从零开始。", quality: "neutral", baseHabitability: 35, baseAcceptance: 28, baseTech: 22, baseCapacity: 32000, baseTrust: 26, tone: "pessimistic" }, quality: "neutral" },
  { era: { id: "pseudo_prosperity", name: "伪繁荣", description: "表面繁华，内部空洞，叙述常常比现实更亮。", quality: "neutral", baseHabitability: 58, baseAcceptance: 50, baseTech: 42, baseCapacity: 90000, baseTrust: 42, tone: "optimistic" }, quality: "neutral" },
  { era: { id: "primordial", name: "洪荒重启", description: "人类文明已荡然无存，地球回归原始自然。寂静中，唯有风与水的循环依旧。", quality: "neutral", baseHabitability: 50, baseAcceptance: 0, baseTech: 0, baseCapacity: 30000, baseTrust: 40, tone: "reliable" }, quality: "neutral" },
  { era: { id: "laboratory_enclave", name: "实验飞地", description: "数个巨型实验室城市各自为政，科技高但社会冰冷。", quality: "neutral", baseHabitability: 48, baseAcceptance: 30, baseTech: 88, baseCapacity: 72000, baseTrust: 35, tone: "reliable" }, quality: "neutral" },
  { era: { id: "nomadic_revival", name: "游牧复兴", description: "定居文明崩溃后，游牧部族再次成为大地的主人。", quality: "neutral", baseHabitability: 40, baseAcceptance: 55, baseTech: 18, baseCapacity: 28000, baseTrust: 50, tone: "reliable" }, quality: "neutral" },
  { era: { id: "underground_arcology", name: "深城生态", description: "地表不宜居，文明转入地下巨型联合体，空间有限但秩序井然。", quality: "neutral", baseHabitability: 38, baseAcceptance: 52, baseTech: 62, baseCapacity: 54000, baseTrust: 44, tone: "reliable" }, quality: "neutral" },
  { era: { id: "forgotten_monolith", name: "被遗忘的丰碑", description: "前人留下的巨型构造散布荒野，功能成谜，科技可被重新激活。", quality: "neutral", baseHabitability: 36, baseAcceptance: 25, baseTech: 65, baseCapacity: 62000, baseTrust: 40, tone: "pessimistic" }, quality: "neutral" },
  { era: { id: "info_blackout", name: "信息黑幕", description: "全球通讯因未知原因中断，文明碎片化，信任稀缺。", quality: "neutral", baseHabitability: 44, baseAcceptance: 20, baseTech: 10, baseCapacity: 36000, baseTrust: 18, tone: "liar" }, quality: "neutral" },
  { era: { id: "megastructure_ruins", name: "巨构遗迹", description: "环绕行星的轨道环已成废墟，残骸不断坠向大地，人们在阴影下生存。", quality: "neutral", baseHabitability: 28, baseAcceptance: 35, baseTech: 58, baseCapacity: 48000, baseTrust: 38, tone: "pessimistic" }, quality: "neutral" },
  { era: { id: "stellar_exodus", name: "星际出奔", description: "星舰开始升空，留下的人面对被抽干资源的母星，在离别与坚守间抉择。", quality: "neutral", baseHabitability: 22, baseAcceptance: 42, baseTech: 80, baseCapacity: 42000, baseTrust: 32, tone: "reliable" }, quality: "neutral" },
  { era: { id: "flood_refuge", name: "洪泛高地", description: "海平面剧烈上升，幸存者挤在最后的群岛高地上。", quality: "neutral", baseHabitability: 32, baseAcceptance: 38, baseTech: 28, baseCapacity: 24000, baseTrust: 42, tone: "pessimistic" }, quality: "neutral" },

  // ── BAD x15 ────────────────────────────────────────────────
  { era: { id: "war", name: "战乱年代", description: "冲突四起，城邦易碎，任何人口流动都伴随代价。", quality: "bad", baseHabitability: 45, baseAcceptance: 32, baseTech: 38, baseCapacity: 50000, baseTrust: 28, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "ecological_collapse", name: "生态崩溃", description: "气候失衡，土地贫瘠，生存本身就是赌博。", quality: "bad", baseHabitability: 18, baseAcceptance: 40, baseTech: 22, baseCapacity: 18000, baseTrust: 36, tone: "liar" }, quality: "bad" },
  { era: { id: "winter", name: "寒冬时代", description: "漫长的寒潮吞没道路，资源与耐心都在消耗。", quality: "bad", baseHabitability: 24, baseAcceptance: 28, baseTech: 30, baseCapacity: 22000, baseTrust: 33, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "plague", name: "瘟疫蔓延", description: "疾病、隔离与恐惧共同统治年代。", quality: "bad", baseHabitability: 30, baseAcceptance: 24, baseTech: 34, baseCapacity: 26000, baseTrust: 26, tone: "liar" }, quality: "bad" },
  { era: { id: "totalitarian", name: "极权时代", description: "秩序高压而稳定，接纳度常被压到最低。", quality: "bad", baseHabitability: 54, baseAcceptance: 18, baseTech: 64, baseCapacity: 68000, baseTrust: 22, tone: "liar" }, quality: "bad" },
  { era: { id: "void", name: "真空荒芜", description: "寂静、空旷、几乎没有文明可言。", quality: "bad", baseHabitability: 8, baseAcceptance: 10, baseTech: 6, baseCapacity: 8000, baseTrust: 14, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "desert_expansion", name: "沙漠扩张", description: "沙丘吞噬城市，水源比黄金更珍贵，部族为一口井厮杀。", quality: "bad", baseHabitability: 14, baseAcceptance: 20, baseTech: 16, baseCapacity: 12000, baseTrust: 18, tone: "liar" }, quality: "bad" },
  { era: { id: "iron_despotism", name: "铁腕暴政", description: "一个全知型独裁者用恐惧统治残存文明，逃跑就是死亡。", quality: "bad", baseHabitability: 40, baseAcceptance: 12, baseTech: 50, baseCapacity: 44000, baseTrust: 10, tone: "liar" }, quality: "bad" },
  { era: { id: "cult_awakening", name: "邪教觉醒", description: "救世主狂热席卷幸存者，理性退场，自毁仪式接连不断。", quality: "bad", baseHabitability: 26, baseAcceptance: 16, baseTech: 12, baseCapacity: 16000, baseTrust: 14, tone: "liar" }, quality: "bad" },
  { era: { id: "genetic_divergence", name: "基因裂变", description: "基因改造失控导致新物种与人类敌对，信任瓦解到原子级。", quality: "bad", baseHabitability: 22, baseAcceptance: 8, baseTech: 70, baseCapacity: 38000, baseTrust: 12, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "neo_feudalism", name: "新封建", description: "土地领主割据，农奴在堡垒阴影下耕作，自由早已失传。", quality: "bad", baseHabitability: 30, baseAcceptance: 14, baseTech: 24, baseCapacity: 28000, baseTrust: 16, tone: "liar" }, quality: "bad" },
  { era: { id: "oceanic_collapse", name: "海洋崩塌", description: "海洋酸化，渔业灭绝，数亿沿海难民涌入内陆引发恐慌。", quality: "bad", baseHabitability: 16, baseAcceptance: 18, baseTech: 20, baseCapacity: 14000, baseTrust: 20, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "echo_chamber", name: "回声密室", description: "信息闭环让所有人活在各自构建的假象中，社会在沉默中分裂。", quality: "bad", baseHabitability: 28, baseAcceptance: 22, baseTech: 8, baseCapacity: 20000, baseTrust: 8, tone: "liar" }, quality: "bad" },
  { era: { id: "nuclear_autumn", name: "核冬天", description: "尘埃遮天蔽日已逾百年，万物凋零，幸存者在地下苟延残喘。", quality: "bad", baseHabitability: 6, baseAcceptance: 15, baseTech: 26, baseCapacity: 6000, baseTrust: 16, tone: "pessimistic" }, quality: "bad" },
  { era: { id: "glacier_walkers", name: "冰川行者", description: "永冻层覆盖大部分陆地，只有极少数游猎部落随着冰川边缘迁徙。", quality: "bad", baseHabitability: 10, baseAcceptance: 25, baseTech: 14, baseCapacity: 10000, baseTrust: 22, tone: "pessimistic" }, quality: "bad" },
];

// ── 预分组 ──────────────────────────────────────────────────
const GOOD = ERA_DEFS.filter(d => d.quality === "good");
const NEUTRAL = ERA_DEFS.filter(d => d.quality === "neutral");
const BAD = ERA_DEFS.filter(d => d.quality === "bad");

const ALL: EraDef[] = [...GOOD, ...NEUTRAL, ...BAD];

// 开局时代固定
const FIXED_WAR_AFTERMATH = ERA_DEFS.find(d => d.era.id === "war_aftermath")!;

// 初始化排除池（前2跳的恶劣上限）
const BLOCKED_START: readonly string[] = ["void", "primordial", "nuclear_autumn", "glacier_walkers"];

/** 确定性伪随机 (基于字符串种子，输出 [0,1)) */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 加权随机挑选（传入权重列表与随机函数） */
function weightedPick<E>(items: E[], weights: number[], rng: () => number): E {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── 保底：记录每局按 eraindex 已被抽到的时代质量 ──
const QUALITY_HISTORY: EraQuality[] = [];

/**
 * 从合格池中随机抽取一个 EraDef
 * 
 * 权重：bad 权重 1.0，neutral 权重 1.5，good 权重 0.6 → good 出现率 ~23%
 */
function sampleFromPool(pool: EraDef[], rng: () => number): EraDef {
  const weights = pool.map(d => {
    if (d.quality === "good") return 0.6;
    if (d.quality === "neutral") return 1.5;
    return 1.0;
  });
  return weightedPick(pool, weights, rng);
}

/** 
 * 判断是否触发保底
 * 阈值由 quality 决定: > 阈值即"好于阈值"
 * good 4 > neutral 2 > bad 0
 */
function qualityOrdinal(q: EraQuality): number {
  if (q === "good") return 4;
  if (q === "neutral") return 2;
  return 0;
}

const PITY_STREAK = 3;      // 连续多少代低于阈值触发保底
const PITY_THRESHOLD = 2;   // 3 (good 4 > 3, neutral/bad ≤ 3)

/** 获取最近 N 代的质量 */
function recentQualities(): readonly EraQuality[] {
  const start = Math.max(0, QUALITY_HISTORY.length - PITY_STREAK);
  return QUALITY_HISTORY.slice(start);
}

export function createEra(eraIndex: number): EraProfile {
  if (eraIndex < 0) return FIXED_WAR_AFTERMATH.era;

  // 第 0 代固定
  if (eraIndex === 0) {
    if (QUALITY_HISTORY.length === 0) QUALITY_HISTORY.push("neutral");
    return FIXED_WAR_AFTERMATH.era;
  }

  // 确保历史已记录 index-1 (万一跳步调用)
  while (QUALITY_HISTORY.length <= eraIndex - 1) {
    QUALITY_HISTORY.push("neutral");
  }

  // 种子
  const rng = mulberry32(eraIndex * 0x9e3779b9 + 12345);

  // 构建合格池
  let pool = ALL.slice();

  // 前 2 跳去除极端恶劣
  if (eraIndex <= 2) {
    pool = pool.filter(d => !BLOCKED_START.includes(d.era.id));
  }

  // 保底：最近 3 代全 ≤ neutral 质量？
  const recent = recentQualities();
  const shouldPity = recent.length >= PITY_STREAK && recent.every(q => qualityOrdinal(q) <= PITY_THRESHOLD);

  if (shouldPity) {
    // 强制从 good/neutral 选
    pool = pool.filter(d => d.quality !== "bad");
  }

  // 最终从池中抽取
  const picked = sampleFromPool(pool, rng);

  // 记录质量历史
  QUALITY_HISTORY.push(picked.quality);

  return picked.era;
}

/** 仅用于测试或重置 */
export function resetEraPool(): void {
  QUALITY_HISTORY.length = 0;
}