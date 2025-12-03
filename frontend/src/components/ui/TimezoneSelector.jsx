import React, { useState, useEffect } from "react";
import {
  getUserTimezone,
  setUserTimezone,
  getTimezoneInfo,
} from "../../utils/timezone";

/**
 * Timezone selector component for user settings.
 * Fetches available timezones from backend and allows selection.
 */
export default function TimezoneSelector({
  value,
  onChange,
  userId = null,
  organizationId = null,
  showCurrentTime = true,
  className = "",
}) {
  const [timezones, setTimezones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTz, setSelectedTz] = useState(value || getUserTimezone());
  const [currentTime, setCurrentTime] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch timezone list from backend
  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await fetch("/api/timezones", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTimezones(data);
        }
      } catch (error) {
        console.error("Error fetching timezones:", error);
        // Fallback to common timezones
        setTimezones([
          { id: "UTC", label: "UTC", region: "Other" },
          {
            id: "Asia/Karachi",
            label: "Pakistan Standard Time (PKT, UTC+5)",
            region: "Asia",
          },
          {
            id: "America/New_York",
            label: "Eastern Time (ET, UTC-5)",
            region: "Americas",
          },
          {
            id: "Europe/London",
            label: "Greenwich Mean Time (GMT, UTC+0)",
            region: "Europe",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimezones();
  }, []);

  // Update current time display
  useEffect(() => {
    const updateTime = () => {
      const info = getTimezoneInfo(selectedTz);
      setCurrentTime(info.currentTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedTz]);

  // Group timezones by region
  const groupedTimezones = timezones.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {});

  const handleChange = async (e) => {
    const newTz = e.target.value;
    setSelectedTz(newTz);

    // Save to localStorage immediately
    setUserTimezone(newTz);

    // If we have a userId or organizationId, save to backend too
    if (userId || organizationId) {
      setSaving(true);
      try {
        const endpoint = userId
          ? `/api/users/${userId}/timezone`
          : `/api/organizations/${organizationId}/timezone`;

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ timezone: newTz }),
        });

        if (!response.ok) {
          console.error("Failed to save timezone to server");
        }
      } catch (error) {
        console.error("Error saving timezone:", error);
      } finally {
        setSaving(false);
      }
    }

    // Call parent onChange if provided
    if (onChange) {
      onChange(newTz);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <select
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
        >
          <option>Loading timezones...</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <select
          value={selectedTz}
          onChange={handleChange}
          disabled={saving}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        >
          {Object.entries(groupedTimezones).map(([region, tzs]) => (
            <optgroup key={region} label={region}>
              {tzs.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {showCurrentTime && (
          <p className="text-sm text-gray-500">
            Current time: <span className="font-medium">{currentTime}</span>
            {saving && <span className="ml-2 text-indigo-500">Saving...</span>}
          </p>
        )}
      </div>
    </div>
  );
}
