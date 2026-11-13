import React, { useState } from "react";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailSection } from "../../components/layout/RightRail";
import { JobRow, OrgMark, StatusTag } from "../../components/jobs/JobBits";
import { Button, ButtonLink } from "../../components/ui/Button";
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  Zap,
  Settings,
  Plus,
} from "lucide-react";

/**
 * JobAlerts — Static settings & active alerts surface.
 * Aligned with Stageshow craft rules: >=12px insets, sentence case,
 * Lucide icons at 14-16px, dark-mode parity, tabular monospace numbers.
 */

const ALERTS = [
  {
    id: "alert-1",
    title: "Software engineer — remote",
    company: "TechCorp Inc.",
    location: "San Francisco, CA · Remote",
    time: "2h ago",
    badge: "New",
    status: "accepted",
  },
  {
    id: "alert-2",
    title: "Frontend developer",
    company: "StartupXYZ",
    location: "New York, NY",
    time: "1d ago",
    badge: "Active",
    status: "reviewed",
  },
];

const PREFERENCES = [
  { label: "Email notifications", desc: "Instant matches to your inbox", icon: Mail, key: "email" },
  { label: "Push notifications", desc: "Browser & mobile pushes", icon: Smartphone, key: "push" },
  { label: "Weekly summary", desc: "Digest every Monday morning", icon: Calendar, key: "summary" },
];

function AlertSettingsCard() {
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    summary: false,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-4">
      <div className="flex flex-col divide-y divide-line dark:divide-line">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const checked = prefs[pref.key];
          return (
            <div key={pref.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-gray-50 dark:border-line dark:bg-gray-25/50">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-500" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13px] font-medium leading-5 text-ink">{pref.label}</p>
                  <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-500">{pref.desc}</p>
                </div>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  aria-label={pref.label}
                  checked={checked}
                  onChange={() => toggle(pref.key)}
                  className="sr-only peer"
                />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 dark:bg-gray-25" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JobAlerts() {
  const railContent = (
    <>
      <RailSection title="Settings">
        <AlertSettingsCard />
      </RailSection>
      <RailSection>
        <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-4">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold leading-5 text-ink">Pro tip</p>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-500">
                Specify salary range and location constraints to reduce noise and receive higher-fit recommendations.
              </p>
            </div>
          </div>
        </div>
      </RailSection>
    </>
  );

  return (
    <AppShell rail={railContent}>
      <CenterBar
        title="Job alerts"
        backTo="/in/jobs"
        backLabel="Jobs"
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink to="/in/jobs" variant="secondary" size="sm">
              <span>Saved jobs</span>
            </ButtonLink>
            <ButtonLink to="/feed" variant="secondary" size="sm">
              <span>Browse jobs</span>
            </ButtonLink>
          </div>
        }
      />

      <div className="px-4 pb-1 pt-3">
        <p className="flex items-center gap-1.5 text-[11px] leading-4 text-gray-500 dark:text-gray-500">
          <Bell className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
          <span>
            Active alerts: <span className="font-mono tabular-nums font-medium text-ink">2</span>
          </span>
        </p>
      </div>

      <div className="mt-2">
        {ALERTS.map((alert) => (
          <JobRow
            key={alert.id}
            avatar={<OrgMark name={alert.company} image={null} />}
            title={alert.title}
            titleSuffix={alert.company ? `at ${alert.company}` : null}
            meta={alert.location}
            time={alert.time}
            actions={<StatusTag status={alert.status}>{alert.badge}</StatusTag>}
            mobileActions={<StatusTag status={alert.status}>{alert.badge}</StatusTag>}
          />
        ))}

        <div className="px-4 py-4">
          <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-gray-50 dark:border-line dark:bg-gray-25/50">
                  <Settings className="h-4 w-4 text-gray-500 dark:text-gray-500" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-5 text-ink">Create a new alert</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-500">
                    Target roles by title, location, or compensation. RecruAI notifies you when new matches publish.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0 gap-1.5">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                <span>New alert</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Settings also accessible on mobile (rail is hidden below lg) */}
        <div className="px-4 pb-6 lg:hidden">
          <RailSection title="Alert settings">
            <AlertSettingsCard />
          </RailSection>
        </div>
      </div>
    </AppShell>
  );
}
