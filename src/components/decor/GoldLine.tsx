type Props = { className?: string };

export default function GoldLine({ className }: Props) {
  return (
    <svg viewBox="0 0 1440 600" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(88% 0.07 95)" />
          <stop offset="100%" stopColor="oklch(75% 0.08 95)" />
        </linearGradient>
      </defs>
      {/* two subtle paths with dash animation */}
      <path
        d="M 0 100 C 300 160 420 60 720 120 C 1020 180 1140 80 1440 140"
        stroke="url(#gold)"
        strokeWidth="2.5"
        fill="none"
        className="animate-dash opacity-70"
      />
      <path
        d="M 0 260 C 240 220 460 300 700 260 C 940 220 1180 300 1440 260"
        stroke="url(#gold)"
        strokeWidth="1.5"
        fill="none"
        className="animate-dash-slow opacity-40"
      />
    </svg>
  );
}
