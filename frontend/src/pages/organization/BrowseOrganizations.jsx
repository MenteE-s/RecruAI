import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { AppShell } from "../../components/layout/AppShell";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import {
  getUploadUrl,
  getBackendUrl,
  getAuthHeaders,
  orgPath,
} from "../../utils/auth";
import {
  FiSearch,
  FiBriefcase,
  FiMapPin,
  FiUsers,
  FiGlobe,
  FiEye,
} from "react-icons/fi";

export default function BrowseOrganizations({ audience = "organization" }) {
  const wrap = (node) =>
    audience === "individual" ? (
      // One owning header: the body renders `Browse organizations`; there is no bar.
      <AppShell>{node}</AppShell>
    ) : (
      <OrgAppShell>{node}</OrgAppShell>
    );
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load organizations
  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/organizations`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
        setFilteredOrganizations(data);
      } else {
        setError("Failed to load organizations");
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Filter organizations based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrganizations(organizations);
    } else {
      const filtered = organizations.filter(
        (org) =>
          org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchTerm, organizations]);

  if (loading) {
    return wrap(
      <div className="space-y-4 px-4 py-4">
        <div className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return wrap(
    <>
      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          {audience === "individual" ? (
            <h2 className="text-[20px] font-semibold leading-7 text-ink">Browse Organizations</h2>
          ) : (
            <h1 className="text-[20px] font-semibold leading-7 text-ink">Browse Organizations</h1>
          )}
          <p className="mt-0.5 text-[13px] text-gray-500">Discover companies and explore opportunities.</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Search organizations by name, description, location, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrganizations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={FiBriefcase}
              title="No Organizations Found"
              body={searchTerm ? "Try adjusting your search terms" : "No organizations available"}
            />
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <div key={org.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link to={orgPath(org)} aria-label={`View ${org.name || "organization"} profile`} className="shrink-0">
                    {org.profile_image ? (
                      <img
                        src={getUploadUrl(org.profile_image)}
                        alt={`${org.name} profile`}
                        className="h-12 w-12 rounded-xl border border-line object-cover transition-colors hover:border-brand"
                      />
                    ) : (
                      <Avatar name={org.name || "?"} size="2xl" rounded="xl" />
                    )}
                  </Link>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{org.name}</h3>
                    {org.industry && <p className="truncate text-xs text-gray-500">{org.industry}</p>}
                  </div>
                </div>
              </div>

              {org.description && (
                <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-gray-600">{org.description}</p>
              )}

              <div className="mt-3 space-y-1.5">
                {org.location && (
                  <div className="flex items-center text-[13px] text-gray-500">
                    <FiMapPin className="mr-2 h-3.5 w-3.5 shrink-0" /> {org.location}
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center text-[13px] text-gray-500">
                    <FiGlobe className="mr-2 h-3.5 w-3.5 shrink-0" />
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-ink hover:text-brand-text">
                      {org.website}
                    </a>
                  </div>
                )}
                {org.company_size && (
                  <div className="flex items-center text-[13px] text-gray-500">
                    <FiUsers className="mr-2 h-3.5 w-3.5 shrink-0" /> {org.company_size} employees
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2 pt-1">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate(orgPath(org))}>
                  <FiEye className="h-3.5 w-3.5" /> Profile
                </Button>
                <ButtonLink to="/feed" variant="secondary" size="sm" className="flex-1">
                  <FiBriefcase className="h-3.5 w-3.5" /> Openings
                </ButtonLink>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
