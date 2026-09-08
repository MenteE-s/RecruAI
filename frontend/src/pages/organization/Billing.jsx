import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSidebarItems, getBackendUrl, getAuthHeaders } from '../../utils/auth';
import Chip from '../../components/ui/Chip';
import { FiCreditCard, FiZap, FiFileText, FiSettings, FiTrendingUp, FiClock, FiCheckCircle, FiAlertTriangle, FiDownload, FiArrowRight } from 'react-icons/fi';

export default function Billing() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [userData, setUserData] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenUsage, setTokenUsage] = useState([]);
  const [usageLoading, setUsageLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUserData(data.user || {});
      setOrganization(data.user?.organization || null);
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenUsage = async () => {
    try {
      setUsageLoading(true);
      const orgId = organization?.id;
      if (orgId) {
        const response = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/usage`, { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setTokenUsage(data.usage || []);
        } else setTokenUsage([]);
      }
    } catch (err) {
      setTokenUsage([]);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => { fetchUserData(); fetchTokenUsage(); }, []);
  useEffect(() => { if (organization?.id) fetchTokenUsage(); }, [organization?.id]);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-44 animate-pulse" />
          <div className="bg-white border border-gray-200 h-64 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <FiAlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <div className="bg-white border border-gray-200 p-12 text-center mt-6">
          <p className="text-sm text-gray-500">Unable to load billing information. Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  const planName = userData?.subscription_status?.is_paid_active ? 'Pro' : userData?.subscription_status?.is_trial_active ? 'Trial' : 'Free';
  const trialEnds = userData?.subscription_status?.trial_start_date ? new Date(new Date(userData.subscription_status.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const isTrialActive = userData?.subscription_status?.is_trial_active;
  const isPaidActive = userData?.subscription_status?.is_paid_active;
  const tokensUsed = userData?.subscription_status?.tokens_used || 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiCreditCard className="w-3.5 h-3.5" />
                BILLING
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Billing & usage</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage your plan, tokens, and invoices.</p>
              <div className="mt-3 flex items-center gap-2">
                <Chip variant={isPaidActive ? 'success' : isTrialActive ? 'warning' : 'secondary'}>{planName} Plan</Chip>
                {isTrialActive && trialEnds && <span className="text-xs text-amber-200 bg-amber-500/20 border border-amber-400/20 px-2 py-1">Trial ends {trialEnds.toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className={`p-4 text-center border backdrop-blur ${isPaidActive ? "bg-green-500/20 border-green-400/20" : "bg-white/10 border-white/10"}`}>
                <p className={`text-lg font-bold ${isPaidActive ? "text-green-300" : "text-white"}`}>{planName}</p>
                <p className={`text-xs mt-1 ${isPaidActive ? "text-green-200" : "text-gray-300"}`}>Plan</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-lg font-bold">{tokensUsed.toLocaleString()}</p>
                <p className="text-xs text-gray-300 mt-1">Tokens</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-lg font-bold text-blue-200">{tokenUsage.length}</p>
                <p className="text-xs text-blue-200 mt-1">Records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Current plan</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Plan type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize mt-1">{planName}</p>
              {planName === 'Trial' && trialEnds && <p className="text-xs text-amber-700 mt-1">Expires {trialEnds.toLocaleDateString()}</p>}
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Tokens used</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{tokensUsed.toLocaleString()}</p>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5">🪙</span>
              </div>
              <div className="mt-2 h-1.5 bg-white border border-gray-200">
                <div className="h-1.5 bg-blue-600" style={{ width: `${Math.min(100, (tokensUsed / 100000) * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{tokensUsed} / 100,000</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
              <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                {isPaidActive ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-green-600">Active</span></> : isTrialActive ? <><span className="w-2 h-2 bg-amber-500 rounded-full" /><span className="text-amber-600">Trial</span></> : <span className="text-gray-500">Free</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Token usage history</h2>
          <span className="ml-auto text-xs text-gray-500">{tokenUsage.length} records</span>
        </div>
        <div className="p-6">
          {usageLoading ? (
            <div className="text-center py-8 flex items-center justify-center gap-2 text-sm text-gray-500"><div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" /> Loading usage…</div>
          ) : tokenUsage.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3"><FiZap className="w-6 h-6 text-gray-400" /></div>
              <p className="text-sm font-medium text-gray-700">No usage yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">Token usage will appear here as you use AI features like search, explanations, and comparisons.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {tokenUsage.map((usage, index) => (
                <div key={index} className="flex items-start justify-between p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{usage.operation_type || 'Unknown Operation'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(usage.created_at || usage.timestamp || Date.now()).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Provider: {usage.provider || 'N/A'} • Model: {usage.model || 'N/A'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1 justify-end">{usage.tokens_used?.toLocaleString() || '0'} <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5">🪙</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Billing Actions */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FiSettings className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Billing actions</h2>
        </div>
        <div className="p-6 space-y-3">
          {!isPaidActive ? (
            <button onClick={() => alert('Upgrade functionality with Stripe integration')} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Upgrade to Pro <FiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => { if (window.confirm('Cancel Pro subscription?')) alert('Cancellation'); }} className="w-full px-6 py-3 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel subscription
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => alert('Invoice download')} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiDownload className="w-4 h-4" /> Download invoice</button>
            <button onClick={() => alert('Payment method update')} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiCreditCard className="w-4 h-4" /> Update payment</button>
          </div>
          <p className="text-xs text-gray-500 text-center pt-2">Secure billing via Stripe • Invoices sent to your email</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
