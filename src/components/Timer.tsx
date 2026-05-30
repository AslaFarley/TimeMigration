export default function Timer({ secondsLeft }: { secondsLeft: number }) {
  const urgent = secondsLeft <= 10;
  return (
    <div className={`timer${urgent ? " timer--urgent" : ""}`}>
      {secondsLeft}s
    </div>
  );
}
