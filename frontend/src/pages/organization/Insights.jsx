import { useState } from "react";
import { OrgAppShell } from "../../components/layout/OrgAppShell";
import {
  Activity,
  TrendingUp,
  Clock,
  Users,
  Zap,
  MapPin,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";

const BENCHMARKS = [
  {
    role: "Senior AI / ML Engineer",
    gulfSalary: "SAR 28,000 – 38,000 /mo",
    pakSalary: "PKR 550,000 – 850,000 /mo",
    velocity: "12 days",
    demand: "Critical (+48%)",
    scarcity: "High",
    topSkills: ["PyTorch", "LangChain", "Vector DBs", "FastAPI"],
  },
  {
    role: "Full-Stack Software Engineer",
    gulfSalary: "SAR 18,000 – 26,000 /mo",
    pakSalary: "PKR 350,000 – 550,000 /mo",
    velocity: "16 days",
    demand: "Strong (+24%)",
    scarcity: "Moderate",
    topSkills: ["React", "Node.js", "PostgreSQL", "TypeScript"],
  },
  {
    role: "DevOps & Cloud Architect",
    gulfSalary: "SAR 24,000 – 34,000 /mo",
    pakSalary: "PKR 450,000 – 750,000 /mo",
    velocity: "14 days",
    demand: "Very high (+36%)",
    scarcity: "High",
    topSkills: ["AWS", "Docker", "Kubernetes", "Terraform"],
  },
  {
    role: "Product Manager (Tech)",
    gulfSalary: "SAR 22,000 – 32,000 /mo",
    pakSalary: "PKR 400,000 – 650,000 /mo",
    velocity: "21 days",
    demand: "Moderate (+18%)",
    scarcity: "Moderate",
    topSkills: ["Product Strategy", "User Journey", "Analytics", "Agile"],
  },
];

export default function Insights() {
  const [selectedRegion, setSelectedRegion] = useState("all");

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between shadow-s5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                <Activity className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink">Recruitment &amp; market insights</h1>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Live recruitment velocity, regional compensation benchmarks, and talent scarcity trends across Pakistan &amp; Gulf markets.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-1 shadow-s5">
            <button
              type="button"
              onClick={() => setSelectedRegion("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedRegion === "all"
                  ? "bg-brand text-white shadow-s5 hover:bg-brand/90"
                  : "text-gray-600 hover:text-ink dark:text-gray-500 dark:hover:text-ink"
              }`}
            >
              All markets
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion("gulf")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedRegion === "gulf"
                  ? "bg-brand text-white shadow-s5 hover:bg-brand/90"
                  : "text-gray-600 hover:text-ink dark:text-gray-500 dark:hover:text-ink"
              }`}
            >
              Gulf region
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion("pak")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedRegion === "pak"
                  ? "bg-brand text-white shadow-s5 hover:bg-brand/90"
                  : "text-gray-600 hover:text-ink dark:text-gray-500 dark:hover:text-ink"
              }`}
            >
              Pakistan
            </button>
          </div>
        </div>

        {/* 4 Key Market KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Time-to-hire</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
                <Clock className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">14.8 days</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-text">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} /> 2.6 days faster than regional average
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Offer acceptance rate</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
                <CheckCircle className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums tracking-tight text-brand-text">89.4%</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              Across verified candidate pool
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">AI scoring accuracy</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
                <Zap className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">94.8%</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-text">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} /> +12% post-interview match
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Talent pool depth</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
                <Users className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">2,450+</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              Verified engineers in Gulf &amp; Pakistan
            </p>
          </div>
        </div>

        {/* Market Benchmark Table */}
        <div className="rounded-xl border border-line bg-surface shadow-s5">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Regional compensation &amp; velocity benchmarks</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Based on aggregated real-world hiring data across Saudi Arabia, UAE, and Pakistan tech corridors.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-gray-50/75 dark:bg-gray-25/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 font-semibold">Role / discipline</th>
                  {selectedRegion !== "pak" && <th className="px-5 py-3 font-semibold">Gulf compensation</th>}
                  {selectedRegion !== "gulf" && <th className="px-5 py-3 font-semibold">Pakistan compensation</th>}
                  <th className="px-5 py-3 font-semibold">Hiring velocity</th>
                  <th className="px-5 py-3 font-semibold">Market demand</th>
                  <th className="px-5 py-3 font-semibold">Top in-demand skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {BENCHMARKS.map((bench) => (
                  <tr key={bench.role} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-25/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink">{bench.role}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">Scarcity: {bench.scarcity}</p>
                    </td>
                    {selectedRegion !== "pak" && (
                      <td className="px-5 py-3.5 text-xs font-medium font-mono tabular-nums text-ink">
                        {bench.gulfSalary}
                      </td>
                    )}
                    {selectedRegion !== "gulf" && (
                      <td className="px-5 py-3.5 text-xs font-medium font-mono tabular-nums text-ink">
                        {bench.pakSalary}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-xs font-mono tabular-nums text-gray-600 dark:text-gray-500">
                      {bench.velocity}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                        <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} /> {bench.demand}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {bench.topSkills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded-lg border border-line bg-gray-50 dark:bg-gray-25 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-500"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                <Zap className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h3 className="text-sm font-semibold text-ink">AI sourcing recommendations</h3>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-gray-600 dark:text-gray-500">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} />
                <span>
                  <strong className="text-ink">Salary transparency:</strong> Job postings listing explicit salary bands in SAR or AED see a <strong className="text-ink font-mono tabular-nums">3.4x</strong> higher applicant conversion rate on RecruAI.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} />
                <span>
                  <strong className="text-ink">Pre-screening quizzes:</strong> <span className="font-mono tabular-nums font-semibold">64%</span> of applicants for Senior Backend positions have skill gaps in distributed systems. Leverage automated CVAI quizzes to filter qualified talent before first interviews.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} />
                <span>
                  <strong className="text-ink">High-match talent alert:</strong> <span className="font-mono tabular-nums font-semibold">18</span> new candidates with verified Python &amp; PostgreSQL skills entered the active job seeker feed this week.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                <MapPin className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h3 className="text-sm font-semibold text-ink">Key talent hubs</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-gray-50/70 dark:bg-gray-25/50 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-ink">Riyadh &amp; Dubai</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Enterprise AI, FinTech, Distributed Systems</p>
                </div>
                <span className="shrink-0 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                  High inflow
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-gray-50/70 dark:bg-gray-25/50 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-ink">Islamabad &amp; Lahore</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Full-Stack Engineering, Cloud Native, Offshore Teams</p>
                </div>
                <span className="shrink-0 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                  High velocity
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrgAppShell>
  );
}
