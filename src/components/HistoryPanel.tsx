import { useState } from "react";
import type { GameHistory } from "@/game/types";

export default function HistoryPanel({ history }: { history: GameHistory }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const entries = [...history.entries].reverse();

  return (
    <section className="history-panel panel">
      <h2 className="panel-title">历史记录</h2>
      {entries.length === 0 ? (
        <p className="muted">尚无记录——每次苏醒后将在此显示当时叙述与真实参数对比。</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => {
            const isOpen = expanded === entry.turn;
            return (
              <li
                key={entry.turn}
                className={`history-item${isOpen ? " history-item--open" : ""}`}
                onClick={() => setExpanded(isOpen ? null : entry.turn)}
              >
                <div className="history-summary">
                  <span className="history-era">{entry.eraName}</span>
                  <span className="history-meta">
                    第 {entry.turn} 轮 · 睡眠 {entry.sleepingYears} 年
                  </span>
                </div>
                {isOpen && (
                  <div className="history-detail">
                    <div className="history-row">
                      <span>决策：{entry.decision === "settle" ? "全体解冻" : "继续沉睡"}</span>
                      <span>先遣队：{entry.sentScout ? `派出，归队 ${entry.scoutReturn}` : "未派出"}</span>
                    </div>
                    <div className="history-row">
                      <span>人口变化：{entry.activeBefore.toLocaleString()} → {entry.activeAfter.toLocaleString()}</span>
                    </div>
                    {entry.sleepLoss > 0 && (
                      <div className="history-row">
                        <span>长睡损耗：-{entry.sleepLoss.toLocaleString()} 人</span>
                      </div>
                    )}
                    {(entry.allianceFormedThisTurn || entry.liarExposedThisTurn) && (
                      <div className="history-row">
                        {entry.allianceFormedThisTurn && <span>🤝 本回合建交</span>}
                        {entry.liarExposedThisTurn && <span>👁 本回合识破谎言</span>}
                      </div>
                    )}
                    <div className="history-truth">
                      <strong>真实参数</strong>
                      <div className="history-row">
                        <span>宜居度 {Math.round(entry.truthSnapshot.habitability)}</span>
                        <span>接纳度 {Math.round(entry.truthSnapshot.acceptance)}</span>
                        <span>科技 {Math.round(entry.truthSnapshot.tech)}</span>
                        <span>民心 {Math.round(entry.truthSnapshot.trust)}</span>
                        <span>承载力 {entry.truthSnapshot.capacity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}