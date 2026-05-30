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
  onSettleAll: () => void;
  onContinue: () => void;
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-badge">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{Math.round(value)}</span>
    </div>
  );
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

        {/* 状态格 */}
        <div className="stats-grid panel">
          <StatBadge label="宜居度" value={world.habitability} />
          <StatBadge label="接纳度" value={world.acceptance} />
          <StatBadge label="科技"   value={world.tech} />
          <StatBadge label="民心"   value={world.trust} />
          <StatBadge label="承载力" value={world.capacity} />
          <StatBadge label="冷冻人口" value={world.frozenPop} />
          <StatBadge label="活跃人口" value={world.activePop} />
        </div>

        {/* 民心预警 */}
        {trustWarning && (
          <div className="warning-banner">
            ⚠ 民心低迷——若持续恶化，将引发政变危机。
          </div>
        )}

        {/* 叙述面板 */}
        <NarrativePanel lines={narrative} />

        {/* 操控区 */}
        <div className="controls panel">
          <label className="control-label">
            <span>睡眠时长：<strong>{sleepingYears} 年</strong></span>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={sleepingYears}
              onChange={(e) => setSleepingYears(Number(e.target.value))}
              className="range-slider"
            />
            <span className="range-hint">短睡 = 渐进探索；长睡 = 大跨度冒险</span>
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
            </p>
          )}
        </div>

        {/* 行动按钮 */}
        <div className="action-row">
          <button className="btn-settle" onClick={onSettleAll}>
            全体解冻定居
          </button>
          <button className="primary btn-continue" onClick={onContinue}>
            确认决策，继续沉睡
          </button>
        </div>
      </div>

      {/* ── 右栏：历史记录 ── */}
      <HistoryPanel history={history} />
    </div>
  );
}
