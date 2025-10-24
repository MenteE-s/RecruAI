export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white rounded-xl p-4">
      <div>
        <div className="text-sm opacity-90">{title}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {change && (
          <div className="text-xs mt-2 inline-flex items-center px-2 py-1 rounded-full bg-white/20">
            {trend === "up" ? "↑" : "↓"} &nbsp; {change}
          </div>
        )}
      </div>
      {Icon && (
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
