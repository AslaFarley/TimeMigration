import type { GameHistory, NarrativeLine, WorldState } from "@/game/types";
import HistoryPanel from "./HistoryPanel";
import NarrativePanel from "./NarrativePanel";
import Timer from "./Timer";

interface Props {
  world: WorldState;
  history: GameHistory;
  narrative: NarrativeLine[];
  secondsLeft: number;
  sleepingYears: number;
  setSleepingYears: (v: number) => void;
  sendScout: boolean;
  setSendScout: (v: boolean) => void;
  trustWarning: boolean;
  /** 剩余睡眠次数 */
  sleepsRemaining: number;
  /** 睡眠次数已耗尽 */
  sleepsExhausted: boolean;
  onSettleAll: () => void;
  onContinue: () => void;
}

export default function DecisionScreen({
  world,
  history,
  narrative,
  secondsLeft,
  sleepingYears,
  setSleepingYears,
  sendScout,
  setSendScout,
  trustWarning,
  sleepsRemaining,
  sleepsExhausted,
  onSettleAll,
  onContinue,
}: Props) {
  const canSendScout = world.frozenPop >= 1200;

  return (
    <div className="decision-layout">
      {/* ── 左栏：决策主面板 ── */}
      <div className="decision-main">
        {/* 头部 */}
        <div className="decision-header panel">
          <div className="decision-header-left">
            <h2 className="era-name">{world.era.name}</h2>
            <p className="era-desc muted">{world.era.description}</p>
          </div>
          <Timer secondsLeft={secondsLeft} />
        </div>

        {/* 人口概览 */}
        <div className="stats-grid panel">
          <div className="stat-badge">
            <span className="stat-label">冷冻人口</span>
            <span className="stat-value">{Math.round(world.frozenPop)}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">活跃人口</span>
            <span className="stat-value">{Math.round(world.activePop)}</span>
          </div>
        </div>

        {/* 永久buff徽章 */}
        {(world.allianceFormed || world.liarExposed) && (
          <div className="perk-badges">
            {world.allianceFormed && (
              <span className="perk-badge perk-badge--alliance" title="已与原住文明建交，长睡损耗减半">
                🤝 建交
              </span>
            )}
            {world.liarExposed && (
              <span className="perk-badge perk-badge--exposed" title="已识破谎言型叙述者，其信息不再反转">
                👁 识谎
              </span>
            )}
          </div>
        )}

        {/* 民心预警 */}
        {trustWarning && (
          <div className="warning-banner">
            ⚠ 民心低迷——若持续恶化，将引发政变危机。
          </div>
        )}

        {/* 剩余睡眠次数提示 */}
        <div className={`remaining-sleeps-hint${sleepsExhausted ? " remaining-sleeps-hint--exhausted" : ""}`}>
          {sleepsExhausted ? (
            <>睡眠次数已耗尽，只能 <strong>全体解冻</strong></>
          ) : (
            <>最多还能睡眠 <strong>{sleepsRemaining}</strong> 次</>
          )}
        </div>

        {/* 叙述面板（含先遣队情报） */}
        <NarrativePanel lines={narrative} />

        {/* 操控区 */}
        <div className="controls panel">
          <label className="control-label">
            <span>睡眠时长：<strong>{sleepingYears} 年</strong></span>
            <input
              type="range"
              min={100}
              max={1000}
              step={100}
              value={sleepingYears}
              onChange={(e) => setSleepingYears(Number(e.target.value))}
              className="range-slider"
            />
          <span className="range-hint">
            短睡（100年·安全）= 渐进探索；长睡（1000年·有损耗）= 大跨度冒险
          </span>
          {sleepingYears > 400 && (
            <span className="sleep-warning">
              ⚠ 长睡超过400年将导致显著人口损耗（{Math.round((sleepingYears / 1000) * 30)}%），建交后可减半。
            </span>
          )}
        </label>


          <label className={`scout-toggle${!canSendScout ? " scout-toggle--disabled" : ""}`}>
            <input
              type="checkbox"
              checked={sendScout}
              disabled={!canSendScout}
              onChange={(e) => setSendScout(e.target.checked)}
            />
            <span>
              派出先遣队（固定 1200 人）
              {!canSendScout && <em className="muted"> — 冷冻人口不足</em>}
            </span>
          </label>
          {sendScout && canSendScout && (
            <p className="scout-hint muted">
              先遣队将自动改造下一时代的最薄弱参数，归队后并入活跃人口并带回真实损耗率情报。
              {!world.allianceFormed && world.era.baseAcceptance >= 60 && (
                <> 当前接纳度高，派出可<b>建交</b>以永久降低长睡损耗。</>
              )}
              {!world.liarExposed && world.era.tone === "liar" && (
                <> 当前叙述者不可靠，派出可<b>识破谎言</b>。</>
              )}
            </p>
          )}
        </div>

        {/* ── 核心决策区（最醒目的两块） ── */}
        <div className="fate-decision">
          <button className="fate-btn fate-btn--settle" onClick={onSettleAll}>
            <span className="fate-btn__title">🏠 全体解冻定居</span>
            <span className="fate-btn__desc">
              将剩余 {Math.round(world.frozenPop).toLocaleString()} 名冷冻人口全部唤醒，定居于此时代，结束移民之旅
            </span>
          </button>

          <button
            className={`fate-btn fate-btn--sleep${sleepsExhausted ? " fate-btn--disabled" : ""}`}
            onClick={onContinue}
            disabled={sleepsExhausted}
          >
            <span className="fate-btn__title">❄️ 确认决策，继续沉睡</span>
            <span className="fate-btn__desc">
              {sleepsExhausted
                ? "睡眠次数已耗尽，请全体解冻定居"
                : `沉睡 ${sleepingYears} 年，${sendScout ? "派出先遣队探索前方" : "直接跃向下一个时代"}`}
            </span>
          </button>
        </div>
      </div>

      {/* ── 右栏：历史记录 ── */}
      <HistoryPanel history={history} />
    </div>
  );
}
