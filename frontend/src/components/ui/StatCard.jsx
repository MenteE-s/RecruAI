// src/components/ui/StatCard.jsx
import Card from "./Card";
export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-secondary-500 text-sm font-medium">{title}</p>
        <p className="text-2xl md:text-3xl font-extrabold text-secondary-900 mt-1">
          {value}
        </p>
        {change && (
          <p
            className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend === "up"
                ? "bg-success-50 text-success-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend === "up" ? "↑" : "↓"} &nbsp; {change}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center rounded-full w-14 h-14 bg-gradient-to-br from-primary-50 to-accent-50 shadow-inner">
        <div className="rounded-full bg-white p-2 shadow">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </Card>
  );
}
