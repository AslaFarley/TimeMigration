import type { EndingResult } from "@/game/types";

interface Props {
  ending: EndingResult;
  onReset: () => void;
  /** LLM 千年史正在生成中 */
  loading?: boolean;
}

const OUTCOME_LABELS: Record<EndingResult["outcome"], string> = {
  success: "文明延续",
  failure: "迁移失控",
  rebirth: "文明重生",
};

export default function EndScreen({ ending, onReset, loading }: Props) {
  return (
    <div className="center-layout">
      <section className="panel end-panel">
        <div className={`end-badge end-badge--${ending.outcome}`}>
          {OUTCOME_LABELS[ending.outcome]}
        </div>
        <h1 className="end-title">{ending.title}</h1>
        <p className={`end-text${loading ? " end-loading" : ""}`}>
          {loading ? "正在生成千年发展史……" : ending.text}
        </p>

        {loading ? (
          <p className="muted end-loading-hint">AI 正在为这段历史续写千年叙事…</p>
        ) : (
          <ul className="end-timeline">
            {ending.timeline.map((line, i) =>
              line ? <li key={i}>{line}</li> : <li key={i} className="end-spacer" />
            )}
          </ul>
        )}

        <p className="muted end-hint">
          成败由你解读。未来版本将由 AI 为这段历史续写千年叙事。
        </p>

        <button className="primary end-reset" onClick={onReset} disabled={loading}>
          重新开始
        </button>
      </section>
    </div>
  );
}