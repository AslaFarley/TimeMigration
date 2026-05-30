import type { NarrativeLine } from "@/game/types";

export default function NarrativePanel({ lines }: { lines: NarrativeLine[] }) {
  if (lines.length === 0) return null;
  return (
    <section className="narrative-panel">
      {lines.map((line) => (
        <article key={line.title} className="narrative-card">
          <h3 className="narrative-title">{line.title}</h3>
          <p className="narrative-text">{line.text}</p>
        </article>
      ))}
    </section>
  );
}
