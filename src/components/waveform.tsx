export function Waveform({ active = false }: { active?: boolean }) {
  return (
    <div className="flex items-end h-5" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${i * 0.08}s`,
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
