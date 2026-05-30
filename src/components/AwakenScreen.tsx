import type { NarrativeLine } from "@/game/types";
import NarrativePanel from "./NarrativePanel";

interface Props {
  eraName: string;
  narrative: NarrativeLine[];
  scoutReturn: number;
  trustWarning: boolean;
  onContinue: () => void;
}

export default function AwakenScreen({ eraName, narrative, scoutReturn, trustWarning, onContinue }: Props) {
  return (
    <div className="center-layout">
      <section className="panel awaken-panel">
        <h2 className="awaken-title">苏醒</h2>
        <p className="awaken-era">{eraName}</p>

        {scoutReturn > 0 && (
          <p className="awaken-scout">先遣队本轮归队 {scoutReturn.toLocaleString()} 人</p>
        )}

        {trustWarning && (
          <div className="warning-banner">
            ⚠ 民心正在动摇——如果信任继续下降，移民计划将面临政变风险。
          </div>
        )}

        <NarrativePanel lines={narrative} />

        <button className="primary awaken-btn" onClick={onContinue}>
          进入决策
        </button>
      </section>
    </div>
  );
}
