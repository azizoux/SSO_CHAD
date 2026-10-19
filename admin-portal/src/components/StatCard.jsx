export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading = false,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>

        <div className="rounded-lg bg-primary-soft p-2">
          <Icon size={20} className="text-primary" />
        </div>
      </div>

      <div className="mt-5 text-3xl font-bold text-slate-900">
        {loading ? "…" : (value ?? "—")}
      </div>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
