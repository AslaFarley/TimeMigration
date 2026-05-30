import type { EraType, NarrativeTone } from "../types";

export interface SeedEntry {
  title: string;
  text: string;
  /** 给历史对比面板看的真值提示 */
  truthHint: string;
}

export const SEED_LIBRARY: Record<EraType, Record<NarrativeTone, SeedEntry[]>> = {
  war_aftermath: {
    reliable: [
      { title: "余烬未冷", text: "战火刚刚平息，幸存者在废墟中寻找食物与庇护。任何人口迁入都可能引发资源争夺，但至少已经没有轰炸。", truthHint: "宜居/接纳极低，数据可信" },
      { title: "废墟之上", text: "城市只剩骨架，但水源仍在流淌。这是一片刚刚停止死亡的土地，一切都悬在刀尖上。", truthHint: "trust低，基建近乎为零" },
    ],
    optimistic: [
      { title: "重建曙光", text: "最坏的时刻已经过去！幸存者们开始清理废墟，合作正在萌芽，这里将成为新世界的起点。", truthHint: "过度乐观，实际param仍极低" },
    ],
    pessimistic: [
      { title: "残存", text: "战争虽然结束，但这里只剩残骸与悲鸣。任何在此定居的尝试都是对绝望的赌博。", truthHint: "偏悲观，但宜居确实触底" },
      { title: "灰烬之冬", text: "土地被烧焦，天空仍布满灰霾。人类想要在这里重新生根，需要奇迹。", truthHint: "悲观但准确，环境恶劣" },
    ],
    liar: [
      { title: "战后繁荣", text: "战争创造了重建的巨大机遇，资源重新分配，一切都比战前更好。", truthHint: "完全虚假，实际一片废土" },
    ],
  },
  golden: {
    reliable: [
      { title: "秩序稳定", text: "街道整洁，粮仓充盈，移民得到有限但稳定的接纳。迁入者的安置速度是近十年最快的。", truthHint: "宜居/接纳均高，数据基本可信" },
      { title: "稳步增长", text: "城市扩张有序，人口容量充足，移民队列被依次安排进入定居区。", truthHint: "承载力充裕，损耗低" },
    ],
    optimistic: [
      { title: "繁荣可期", text: "这是一片近乎理想的土地，未来几乎一片光明。叙述者的语气显得格外振奋。", truthHint: "叙述偏乐观，可能夸大接纳度" },
      { title: "盛世到来", text: "任何来到这里的人都将获得充分的资源与机会，没有什么值得担忧的。", truthHint: "信息偏乐观，实际 trust 可能略低" },
    ],
    pessimistic: [
      { title: "暗流", text: "看似平和的黄金时代，也许藏着裂痕——叙述者总在暗示一切都会变坏。", truthHint: "叙述偏悲观，实际可能比描述好" },
    ],
    liar: [
      { title: "误导信息", text: "此地毫无风险，任何规模的人口增长都绝无代价。先遣队几乎不会有任何损耗。", truthHint: "与真值相反，实际有损耗" },
    ],
  },
  war: {
    reliable: [
      { title: "战火四起", text: "城墙残破，逃亡者拥挤在关口，生存靠运气。迁入移民的损耗率显著高于和平时代。", truthHint: "接纳/宜居低，数据可信" },
      { title: "交战区", text: "边境冲突频发，资源补给中断，任何定居计划都面临随机清算。", truthHint: "trust 低，实际数据真实" },
    ],
    optimistic: [
      { title: "前线捷报", text: "局势已显著好转，短暂动荡不会影响移民计划。叙述者强调胜利在望。", truthHint: "夸大好消息，实际接纳度低" },
    ],
    pessimistic: [
      { title: "危局", text: "每一条路都通向损耗，迁居的代价正在不断攀升。叙述者的语调充满绝望。", truthHint: "偏悲观，实际可能略好于描述" },
    ],
    liar: [
      { title: "虚假安定", text: "这里没有战争，人口将持续安全增长，所有叙述都是可靠的。", truthHint: "与真值相反，实际战乱严重" },
    ],
  },
  ecological_collapse: {
    reliable: [
      { title: "生态警报", text: "水源退化，空气稀薄，生物群落正在崩解。迁入后的存活率取决于科技支撑。", truthHint: "宜居极低，数据可信" },
    ],
    optimistic: [
      { title: "绿洲将至", text: "生态问题已被控制，接下来的时代会更温和，不必过于担心环境风险。", truthHint: "乐观包装，实际宜居低" },
    ],
    pessimistic: [
      { title: "枯竭", text: "土地正在死去，移民的迁入不过是延迟一场不可避免的消耗。", truthHint: "偏悲观，但宜居确实低" },
    ],
    liar: [
      { title: "丰饶之地", text: "土壤肥沃、空气清澈，仿佛这片土地从未经历过任何灾变。", truthHint: "与真值矛盾，实际宜居极低" },
    ],
  },
  tech_singularity: {
    reliable: [
      { title: "技术跃迁", text: "算法、能源与材料学一起跨过门槛，城市承载能力极强，但接纳体系仍在适配中。", truthHint: "科技高，数据可信" },
      { title: "超算时代", text: "基础设施已被人工智能全面接管，移民的安置效率大幅提升，但社会摩擦依然存在。", truthHint: "tech 极高，接纳度中等，可信" },
    ],
    optimistic: [
      { title: "黄金明日", text: "所有危险都已被技术驯服，未来只会更好。叙述者的乐观几乎令人怀疑。", truthHint: "偏乐观，接纳度可能被夸大" },
    ],
    pessimistic: [
      { title: "失控风险", text: "技术在快速前进，但人类社会未必跟得上，不稳定性被严重低估。", truthHint: "偏悲观，实际 tech 高但 trust 中" },
    ],
    liar: [
      { title: "彻底安全", text: "这里没有任何不确定性，所有人都能永远无损定居，科技保证了绝对安全。", truthHint: "反向，实际接纳度不稳定" },
    ],
  },
  pseudo_prosperity: {
    reliable: [
      { title: "表面富足", text: "外表商业繁荣，高楼林立，但底层信任正在流失，社会契约开始松动。", truthHint: "trust 偏低，数据基本可信" },
    ],
    optimistic: [
      { title: "盛景", text: "一切都在向好发展，移民将享受前所未有的机会，叙述者充满溢美之词。", truthHint: "夸大，实际 trust/habitability 偏低" },
      { title: "繁荣扩张", text: "市场开放，移民配额充足，未来几乎没有任何障碍。", truthHint: "乐观，实际承载力有上限" },
    ],
    pessimistic: [
      { title: "空心增长", text: "繁荣是假的，真正的代价已经开始显现，叙述者不相信这一切能持续。", truthHint: "偏悲观，但 trust 确实有问题" },
    ],
    liar: [
      { title: "完全稳固", text: "这是一个没有冲突、没有损耗、没有任何代价的时代，定居在此是最优解。", truthHint: "矛盾，实际 trust 低" },
    ],
  },
  winter: {
    reliable: [
      { title: "寒潮", text: "极寒让补给和迁移都变慢，任何移动都要付出额外代价，存活率与速度成反比。", truthHint: "宜居低，数据可信" },
    ],
    optimistic: [
      { title: "冬尽春来", text: "寒冬即将结束，未来会比现在好得多，叙述者坚信转折已近在眼前。", truthHint: "乐观，实际宜居仍低" },
    ],
    pessimistic: [
      { title: "漫长黑夜", text: "寒冬没有尽头，人口只会在极寒中缓慢枯竭，希望渺茫。", truthHint: "偏悲观，宜居确实低" },
      { title: "冻结", text: "温度继续下降，任何行动都会消耗更多资源。叙述者建议放弃这个时代。", truthHint: "悲观但准确" },
    ],
    liar: [
      { title: "温暖复苏", text: "这里温度适宜，粮食充沛，几乎无需担忧任何环境风险。", truthHint: "反向，实际宜居极低" },
    ],
  },
  plague: {
    reliable: [
      { title: "隔离线", text: "疾病在城市扩散，任何接触都可能引发连锁损耗，移民需要通过严格的隔离程序。", truthHint: "接纳/trust 低，数据可信" },
    ],
    optimistic: [
      { title: "疫病已控", text: "疫情已被有效控制，迁居不会造成大范围损耗，叙述者对此充满信心。", truthHint: "夸大，实际接纳低" },
    ],
    pessimistic: [
      { title: "感染区", text: "每一次停留都在增加死亡概率，叙述者建议绕开这个时代。", truthHint: "偏悲观，但宜居确实低" },
    ],
    liar: [
      { title: "净土", text: "这里没有疫情，所有迁入者都会获得完美庇护，损耗几乎为零。", truthHint: "矛盾，实际损耗高" },
    ],
  },
  revival: {
    reliable: [
      { title: "复苏", text: "秩序逐步恢复，新的合作正在形成，移民接纳速度稳步提升。", truthHint: "宜居/接纳均好，数据可信" },
      { title: "重建", text: "废墟上的新秩序已经站稳脚跟，资源重新流通，迁居者能获得基本保障。", truthHint: "正向时代，数据真实" },
    ],
    optimistic: [
      { title: "希望之地", text: "这是最适合迁移的时代，未来几乎不会让人失望，叙述者难掩兴奋。", truthHint: "乐观，但接近真值" },
    ],
    pessimistic: [
      { title: "残响", text: "复兴是缓慢的，想要真正扎根仍需承担相当的代价，叙述者不愿高估任何东西。", truthHint: "偏悲观，实际比描述好" },
    ],
    liar: [
      { title: "永恒安宁", text: "这个时代绝不会再出现任何损耗，一切问题都已经永久解决。", truthHint: "矛盾，实际仍有代价" },
    ],
  },
  totalitarian: {
    reliable: [
      { title: "高压秩序", text: "资源统一分配，城市运转高效，但接纳新来者的空间极小，排外情绪弥漫。", truthHint: "接纳极低，数据可信" },
    ],
    optimistic: [
      { title: "统一繁荣", text: "在高度秩序下，移民将享有稳定生活，政权保证一切需求，叙述者赞扬这种安排。", truthHint: "夸大，实际接纳低" },
    ],
    pessimistic: [
      { title: "封闭", text: "这里不会接纳外来者，任何迁入都可能引发大规模损耗，建议放弃这个时代。", truthHint: "偏悲观，但接纳确实低" },
    ],
    liar: [
      { title: "完全开放", text: "政体非常欢迎移民，任何人都能自由安居，没有任何排外记录。", truthHint: "反向，实际接纳极低" },
    ],
  },
  void: {
    reliable: [
      { title: "荒芜", text: "几乎没有文明，只有残余设施与漫长风声。人口损耗率将是所有时代中最高的。", truthHint: "宜居/接纳极低，数据可信" },
    ],
    optimistic: [
      { title: "最后绿洲", text: "这片荒原是新世界的起点，适合重新生长，叙述者相信在这里一切皆有可能。", truthHint: "极度乐观，实际宜居极低" },
    ],
    pessimistic: [
      { title: "终点", text: "没有任何时代会比这里更恶劣，选择在此定居几乎等于放弃。", truthHint: "偏悲观，但宜居确实接近零" },
    ],
    liar: [
      { title: "繁华都市", text: "这里人潮涌动，秩序良好，基础设施完善，几乎无需担忧任何生存问题。", truthHint: "反向，实际荒芜" },
    ],
  },
  primordial: {
    reliable: [
      {
        title: "寂静地球",
        text: "城市已成废墟残骸，森林重新占领大陆。气候温和但没有任何科技支撑，人类必须从零开始。",
        truthHint: "宜居度恢复但无技术设施，数据可信",
      },
      {
        title: "原始复苏",
        text: "生态已经自我修复，空气清新、水源洁净。但没有道路、没有电网、没有任何文明的痕迹。",
        truthHint: "承载力取决于自然资源，无接纳度概念",
      },
    ],
    optimistic: [
      {
        title: "新伊甸",
        text: "这是一张白纸！人类文明将以更智慧的方式重新书写，没有过去的错误，只有无限的可能。",
        truthHint: "过度乐观，实际重建极其艰难",
      },
    ],
    pessimistic: [
      {
        title: "终末孤寂",
        text: "无论曾经何等辉煌，最终只剩风声。这是宇宙对文明傲慢的最终回答。",
        truthHint: "偏悲观，但自然环境确实已恢复",
      },
    ],
    liar: [
      {
        title: "繁荣依旧",
        text: "城市灯火通明，文明从未中断，一切如常运转。你只是做了一个漫长的梦。",
        truthHint: "完全虚假，实际文明已灭绝",
      },
    ],
  },
};