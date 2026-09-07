import React, { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiSettings } from 'react-icons/fi';
import Chip from '../../components/ui/Chip';
import { getBackendUrl, getAuthHeaders } from '../../utils/auth';

export default function Billing() {
  const [userData, setUserData] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenUsage, setTokenUsage] = useState([]);
  const [usageLoading, setUsageLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUserData(data.user || {});
      setOrganization(data.user?.organization || null);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenUsage = async () => {
    try {
      setUsageLoading(true);
      // Assuming there's an endpoint for token usage - if not, we'll need to create one
      // For now, we'll simulate with empty array or try to fetch from a potential endpoint
      const orgId = organization?.id;
      if (orgId) {
        const response = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/usage`, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          setTokenUsage(data.usage || []);
        } else {
          // If endpoint doesn't exist, we'll leave it empty for now
          console.log('Token usage endpoint not available');
          setTokenUsage([]);
        }
      }
    } catch (err) {
      console.error('Error fetching token usage:', err);
      setTokenUsage([]);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchTokenUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
            <div className="flex items-center gap-3">
              <Chip variant="secondary">Loading...</Chip>
            </div>
          </div>
          <div className="animate-pulse bg-white rounded-lg p-6 h-96">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-6" role="alert">
            <p className="font-medium">{error}</p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Unable to load billing information. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const planName = userData?.subscription_status?.is_paid_active 
    ? 'Pro' 
    : userData?.subscription_status?.is_trial_active 
      ? 'Trial' 
      : 'Free';

  const trialEnds = userData?.subscription_status?.trial_start_date 
    ? new Date(new Date(userData.subscription_status.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000) 
    : null;

  const isTrialActive = userData?.subscription_status?.is_trial_active;
  const isPaidActive = userData?.subscription_status?.is_paid_active;
  const tokensUsed = userData?.subscription_status?.tokens_used || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
          <div className="flex items-center gap-3">
            <Chip 
              variant={isPaidActive ? 'success' : isTrialActive ? 'warning' : 'secondary'}
            >
              {planName} Plan
            </Chip>
          </div>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiUsers className="text-blue-600" />
              Current Plan
            </h2>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Plan Type</p>
                <p className="text-lg font-medium text-gray-900 capitalize">{planName}</p>
                {planName === 'Trial' && trialEnds && (
                  <p className="text-xs text-orange-500 mt-1">
                    Expires: {trialEnds.toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Tokens Used This Month</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold text-gray-900">{tokensUsed.toLocaleString()}</p>
                  <Chip className="bg-blue-50 text-blue-800 text-[10px] px-2 py-0.5 rounded">
                    🪙
                  </Chip>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {/* Assuming a limit - this would come from config or subscription details */}
                  {tokensUsed} / 100,000 tokens
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-lg font-medium">
                  {isPaidActive ? (
                    <span className="text-green-600">Active</span>
                  ) : isTrialActive ? (
                    <span className="text-amber-600">Trial</span>
                  ) : (
                    <span className="text-gray-500">Free</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiFileText className="text-indigo-600" />
              Token Usage History
            </h2>
          </div>
          <div className="px-6 py-6">
            {usageLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse inline-block h-4 w-4 rounded-full bg-gray-300"></div>
                <span className="ml-2 text-gray-500">Loading usage data...</span>
              </div>
            ) : tokenUsage.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No token usage data available yet.</p>
                <p className="text-xs text-gray-400 mt-2">
                  Token usage will appear here as you use AI-powered features like search, explanations, and comparisons.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tokenUsage.map((usage, index) => (
                  <div key={index} className="border-t border-gray-200 pt-4 first:border-t-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{usage.operation_type || 'Unknown Operation'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(usage.created_at || usage.timestamp || Date.now()).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="font-bold text-gray-900">{usage.tokens_used?.toLocaleString() || '0'}</p>
                        <Chip className="bg-blue-50 text-blue-800 text-[8px] px-1.5 py-0 rounded">
                          🪙
                        </Chip>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Provider: {usage.provider || 'N/A'} | Model: {usage.model || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSettings className="text-gray-600" />
              Billing Actions
            </h2>
          </div>
          <div className="px-6 py-6 space-y-4">
            {!isPaidActive && (
              <button 
                onClick={() => {
                  // TODO: Implement actual upgrade flow
                  alert('Upgrade functionality would be implemented here with Stripe integration');
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-green-500 text-white font-semibold rounded-lg shadow-md hover:from-yellow-500 hover:to-green-600 transition-all duration-200"
              >
                Upgrade to Pro Plan
              </button>
            )}
            {isPaidActive && (
              <button 
                onClick={() => {
                  // TODO: Implement actual downgrade/cancel flow
                  if (window.confirm('Are you sure you want to cancel your Pro subscription?')) {
                    alert('Cancellation functionality would be implemented here');
                  }
                }}
                className="w-full px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel Subscription
              </button>
            )}
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <button 
                onClick={() => {
                  // TODO: Implement invoice download
                  alert('Invoice download functionality would be implemented here');
                }}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 font-medium rounded hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                Download Invoice
              </button>
              <button 
                onClick={() => {
                  // TODO: Implement payment method update
                  alert('Payment method update functionality would be implemented here');
                }}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 font-medium rounded hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}