"use client";

interface WalkthroughProgressProps {
  total: number;
  current: number;
}

export function WalkthroughProgress({
  total,
  current,
}: WalkthroughProgressProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={`walkthrough-progress-${index}`}
          className={`h-2 w-6 rounded-full transition ${
            index <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
      <span className="font-semibold text-foreground">{current + 1}</span>/
      <span>{total}</span>
    </div>
  );
}
