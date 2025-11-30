import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { FiUser, FiUsers, FiSearch, FiEye } from "react-icons/fi";

export default function HirePeople() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load all users for hiring
  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to only show individual users (not organizations)
        const individualUsers = data.filter(
          (user) => user.role === "individual"
        );
        setUsers(individualUsers);
        setFilteredUsers(individualUsers);
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Navigate to user profile
  const viewUserProfile = (userId) => {
    navigate(`/organization/user/${userId}`);
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse">
            <div className="text-gray-500 mb-4">Loading users...</div>
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
            <div className="flex items-center">
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

      <div className="mb-8">
        <div className="rounded-2xl p-8 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
                  Discover Top Talent
                </h1>
                <p className="text-lg text-white/90 mb-4">
                  Browse through our curated pool of skilled professionals ready
                  to join your team
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span>{filteredUsers.length} Candidates Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span>Updated Daily</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl opacity-20">👥</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value="">All Roles</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="manager">Manager</option>
            </select>
            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value="">Experience Level</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (3-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
            </select>
          </div>
        </div>
        {searchTerm && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Found {filteredUsers.length} candidate
              {filteredUsers.length !== 1 ? "s" : ""} matching "{searchTerm}"
            </span>
            <button
              onClick={() => setSearchTerm("")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-16">
              <FiUsers size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Candidates Found
              </h3>
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? "Try adjusting your search terms or browse all candidates"
                  : "No candidates available at the moment"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </Card>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md"
            >
              <div className="p-6">
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="relative">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.name || "Profile"}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-white font-bold text-xl">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {user.name || "Anonymous User"}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "individual"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {user.role === "individual"
                            ? "👤 Candidate"
                            : "🏢 Organization"}
                        </span>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.plan === "pro"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.plan === "pro" ? "⭐ Pro" : "📋 Trial"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">--</div>
                    <div className="text-xs text-gray-600">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">--</div>
                    <div className="text-xs text-gray-600">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">--</div>
                    <div className="text-xs text-gray-600">Projects</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => viewUserProfile(user.id)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                  >
                    <FiEye className="mr-2" size={16} />
                    View Profile
                  </button>
                  <button className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200">
                    <FiUser size={16} />
                  </button>
                </div>

                {/* Last Active */}
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Active recently
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
