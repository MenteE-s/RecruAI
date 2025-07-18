import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Alex Chen",
    email: "alex@example.com",
    plan: "Premium",
    avatar: "👨‍💻"
  });

  const [stats, setStats] = useState({
    totalInterviews: 24,
    averageScore: 8.5,
    improvement: "+15%",
    streak: 7
  });

  const [recentInterviews, setRecentInterviews] = useState([
    {
      id: 1,
      company: "Google",
      role: "Software Engineer",
      date: "2025-01-14",
      score: 9.2,
      status: "Excellent",
      duration: "45 min"
    },
    {
      id: 2,
      company: "Meta",
      role: "Product Manager",
      date: "2025-01-13",
      score: 7.8,
      status: "Good",
      duration: "38 min"
    },
    {
      id: 3,
      company: "Microsoft",
      role: "Data Scientist",
      date: "2025-01-12",
      score: 8.6,
      status: "Very Good",
      duration: "42 min"
    }
  ]);

  const [upcomingInterviews, setUpcomingInterviews] = useState([
    {
      id: 1,
      company: "Amazon",
      role: "Senior SDE",
      date: "2025-01-16",
      time: "2:00 PM",
      type: "Technical"
    },
    {
      id: 2,
      company: "Apple",
      role: "iOS Developer",
      date: "2025-01-18",
      time: "10:00 AM",
      type: "Behavioral"
    }
  ]);

  const handleLogout = () => {
    // Clear user session and redirect to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-lg font-display font-bold text-secondary-900">RecruAI</span>
              </Link>
              
              {/* Dashboard Navigation */}
              <nav className="hidden md:flex space-x-6 ml-8">
                <Link to="/dashboard" className="text-primary-600 font-medium">
                  Dashboard
                </Link>
                <Link to="/interviews" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Interviews
                </Link>
                <Link to="/progress" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Progress
                </Link>
                <Link to="/study" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Study Materials
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-secondary-600">
                Welcome back, <span className="font-semibold text-secondary-900">{user.name}</span>
              </div>
              
              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50 transition-colors">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{user.avatar}</span>
                  </div>
                  <svg className="w-4 h-4 text-secondary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                      Profile Settings
                    </Link>
                    <Link to="/billing" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                      Billing
                    </Link>
                    <hr className="my-1 border-secondary-200" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Interviews</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.totalInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Average Score</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.averageScore}/10</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Improvement</p>
                <p className="text-3xl font-bold text-success-600">{stats.improvement}</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Current Streak</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.streak} days</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors group">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-secondary-900">Start Interview</p>
                    <p className="text-sm text-secondary-600">Begin a new mock session</p>
                  </div>
                </button>

                <button className="flex items-center p-4 bg-accent-50 hover:bg-accent-100 rounded-lg border border-accent-200 transition-colors group">
                  <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-secondary-900">Review Progress</p>
                    <p className="text-sm text-secondary-600">Check your analytics</p>
                  </div>
                </button>

                <button className="flex items-center p-4 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200 transition-colors group">
                  <div className="w-10 h-10 bg-success-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-secondary-900">Study Materials</p>
                    <p className="text-sm text-secondary-600">Access resources</p>
                  </div>
                </button>

                <button className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors group">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-secondary-900">Get Help</p>
                    <p className="text-sm text-secondary-600">Support & tutorials</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Interview Results */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Recent Interview Results</h3>
                <Link to="/interviews" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-primary-600">
                          {interview.company.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900">{interview.company}</p>
                        <p className="text-sm text-secondary-600">{interview.role}</p>
                        <p className="text-xs text-secondary-500">{interview.date} • {interview.duration}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        interview.score >= 9 ? 'bg-success-100 text-success-700' :
                        interview.score >= 7 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {interview.status}
                      </div>
                      <p className="text-lg font-bold text-secondary-900 mt-1">{interview.score}/10</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Progress Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Weekly Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Mon</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900">8.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Tue</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900">9.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Wed</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900">7.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Thu</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{width: '95%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900">9.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Fri</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-accent-600 h-2 rounded-full animate-pulse" style={{width: '0%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-500">--</span>
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Upcoming Practice</h3>
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="p-4 bg-accent-50 rounded-lg border border-accent-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-secondary-900">{interview.company}</p>
                      <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full">
                        {interview.type}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-1">{interview.role}</p>
                    <p className="text-xs text-secondary-500">{interview.date} at {interview.time}</p>
                  </div>
                ))}
                
                <button className="w-full p-3 border-2 border-dashed border-secondary-300 rounded-lg text-secondary-600 hover:border-primary-300 hover:text-primary-600 transition-colors">
                  + Schedule New Practice
                </button>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Perfect Score</p>
                    <p className="text-xs text-secondary-600">Scored 10/10 in technical interview</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">7-Day Streak</p>
                    <p className="text-xs text-secondary-600">Practiced for 7 consecutive days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Improvement Master</p>
                    <p className="text-xs text-secondary-600">+15% score improvement this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;