import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getUploadUrl } from "../../utils/auth";
import {
  FiSearch,
  FiBriefcase,
  FiMapPin,
  FiUsers,
  FiGlobe,
  FiEye,
} from "react-icons/fi";

export default function BrowseOrganizations() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

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
      const response = await fetch("/api/organizations", {
        credentials: "include",
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
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse">
            <div className="text-gray-500 mb-4">Loading organizations...</div>
            <div className="w-64 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Browse Organizations
              </h1>
              <p className="mt-1 text-white/90">
                Discover companies and explore opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations by name, description, location, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiBriefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Organizations Found
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No organizations available"}
            </p>
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {org.profile_image ? (
                        <img
                          src={getUploadUrl(org.profile_image)}
                          alt={`${org.name} profile`}
                          className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <FiBriefcase size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {org.name}
                      </h3>
                      {org.industry && (
                        <p className="text-sm text-gray-500">{org.industry}</p>
                      )}
                    </div>
                  </div>
                </div>

                {org.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {org.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {org.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiMapPin className="mr-2" size={14} />
                      {org.location}
                    </div>
                  )}
                  {org.website && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiGlobe className="mr-2" size={14} />
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {org.website}
                      </a>
                    </div>
                  )}
                  {org.company_size && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiUsers className="mr-2" size={14} />
                      {org.company_size} employees
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/organization/profile/${org.id}`)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FiEye className="mr-2" size={16} />
                    View Profile
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
