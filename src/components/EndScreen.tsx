import type { EndingResult } from "@/game/types";

interface Props {
  ending: EndingResult;
  onReset: () => void;
}

export default function EndScreen({ ending, onReset }: Props) {
  return (
    <div className="center-layout">
      <section className="panel end-panel">
        <div className={`end-badge end-badge--${ending.outcome}`}>
          {ending.outcome === "success" ? "文明延续" : "迁移失控"}
        </div>
        <h1 className="end-title">{ending.title}</h1>
        <p className="end-text">{ending.text}</p>

        <ul className="end-timeline">
          {ending.timeline.map((line, i) =>
            line ? <li key={i}>{line}</li> : <li key={i} className="end-spacer" />
          )}
        </ul>

        <p className="muted end-hint">
          成败由你解读。未来版本将由 AI 为这段历史续写千年叙事。
        </p>

        <button className="primary end-reset" onClick={onReset}>
          重新开始
        </button>
      </section>
    </div>
  );
}
