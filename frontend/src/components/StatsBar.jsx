export default function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="border border-hairline rounded-sm px-4 py-3 bg-white">
          <p className="font-serif text-2xl leading-none">{s.value}</p>
          <p className="text-xs text-ink-light mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
