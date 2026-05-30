import type { EraProfile, EraType } from "./types";

export const ERA_LIBRARY: Record<EraType, EraProfile> = {
  war_aftermath: {
    id: "war_aftermath",
    name: "战后废土",
    description: "战争刚刚结束，城市沦为废墟，幸存者在残骸中搜寻余烬。秩序尚未重建，一切从零开始。",
    baseHabitability: 35,
    baseAcceptance: 28,
    baseTech: 22,
    baseCapacity: 32000,
    baseTrust: 26,
    tone: "pessimistic",
  },
  golden: {
    id: "golden",
    name: "黄金时代",
    description: "资源丰沛，秩序稳定，叙述却可能过于乐观。",
    baseHabitability: 82,
    baseAcceptance: 78,
    baseTech: 70,
    baseCapacity: 120000,
    baseTrust: 72,
    tone: "optimistic",
  },
  revival: {
    id: "revival",
    name: "复兴纪元",
    description: "废墟中重新长出秩序，世界缓慢恢复呼吸。",
    baseHabitability: 66,
    baseAcceptance: 68,
    baseTech: 54,
    baseCapacity: 76000,
    baseTrust: 66,
    tone: "reliable",
  },
  tech_singularity: {
    id: "tech_singularity",
    name: "科技奇点",
    description: "技术飞跃，规则改写，但人群未必因此安全。",
    baseHabitability: 74,
    baseAcceptance: 55,
    baseTech: 95,
    baseCapacity: 160000,
    baseTrust: 60,
    tone: "reliable",
  },
  pseudo_prosperity: {
    id: "pseudo_prosperity",
    name: "伪繁荣",
    description: "表面繁华，内部空洞，叙述常常比现实更亮。",
    baseHabitability: 58,
    baseAcceptance: 50,
    baseTech: 42,
    baseCapacity: 90000,
    baseTrust: 42,
    tone: "optimistic",
  },
  totalitarian: {
    id: "totalitarian",
    name: "极权时代",
    description: "秩序高压而稳定，接纳度常被压到最低。",
    baseHabitability: 54,
    baseAcceptance: 18,
    baseTech: 64,
    baseCapacity: 68000,
    baseTrust: 22,
    tone: "liar",
  },
  winter: {
    id: "winter",
    name: "寒冬时代",
    description: "漫长的寒潮吞没道路，资源与耐心都在消耗。",
    baseHabitability: 24,
    baseAcceptance: 28,
    baseTech: 30,
    baseCapacity: 22000,
    baseTrust: 33,
    tone: "pessimistic",
  },
  war: {
    id: "war",
    name: "战乱年代",
    description: "冲突四起，城邦易碎，任何人口流动都伴随代价。",
    baseHabitability: 45,
    baseAcceptance: 32,
    baseTech: 38,
    baseCapacity: 50000,
    baseTrust: 28,
    tone: "pessimistic",
  },
  plague: {
    id: "plague",
    name: "瘟疫蔓延",
    description: "疾病、隔离与恐惧共同统治年代。",
    baseHabitability: 30,
    baseAcceptance: 24,
    baseTech: 34,
    baseCapacity: 26000,
    baseTrust: 26,
    tone: "liar",
  },
  ecological_collapse: {
    id: "ecological_collapse",
    name: "生态崩溃",
    description: "气候失衡，土地贫瘠，生存本身就是赌博。",
    baseHabitability: 18,
    baseAcceptance: 40,
    baseTech: 22,
    baseCapacity: 18000,
    baseTrust: 36,
    tone: "liar",
  },
  void: {
    id: "void",
    name: "真空荒芜",
    description: "寂静、空旷、几乎没有文明可言。",
    baseHabitability: 8,
    baseAcceptance: 10,
    baseTech: 6,
    baseCapacity: 8000,
    baseTrust: 14,
    tone: "pessimistic",
  },
  primordial: {
    id: "primordial",
    name: "洪荒重启",
    description: "人类文明已荡然无存，地球回归原始自然。寂静中，唯有风与水的循环依旧。",
    baseHabitability: 50,
    baseAcceptance: 0,
    baseTech: 0,
    baseCapacity: 30000,
    baseTrust: 40,
    tone: "reliable",
  },
};

/** 单向线性衰亡时间线（不循环，抵达终末后封顶） */
export const ERA_ORDER: EraType[] = [
  "war_aftermath",       // 0  战后废土·开局
  "winter",              // 1
  "pseudo_prosperity",   // 2
  "revival",             // 3  接纳度高 ← 建交窗口
  "golden",              // 4  接纳度高 ← 建交窗口（峰值）
  "tech_singularity",    // 5
  "totalitarian",        // 6  liar ← 识谎窗口
  "plague",              // 7  liar ← 识谎窗口
  "ecological_collapse", // 8  liar ← 识谎窗口
  "void",                // 9
  "primordial",          // 10 终末·洪荒重启
];

/** 根据整局演化索引生成时代（线性不循环，抵达终末后永远停在洪荒） */
export function createEra(index: number): EraProfile {
  const clamped = Math.min(index, ERA_ORDER.length - 1);
  return ERA_LIBRARY[ERA_ORDER[clamped]];
}