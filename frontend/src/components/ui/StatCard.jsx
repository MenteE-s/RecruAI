// src/components/ui/StatCard.jsx
import Card from "./Card";
export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  variant = "default",
}) {
  if (variant === "gradient") {
    return (
      <div className="flex items-center justify-between gap-4 bg-slate-700 text-white rounded-xl p-4">
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

  if (variant === "cyan") {
    return (
      <div className="flex items-center justify-between gap-4 bg-blue-600 text-white rounded-xl p-4">
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

  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          {value}
        </p>
        {change && (
          <p
            className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend === "up"
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {trend === "up" ? "↑" : "↓"} &nbsp; {change}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center rounded-full w-14 h-14 bg-slate-700">
        <Icon className="h-6 w-6 text-slate-300" />
      </div>
    </Card>
  );
}
