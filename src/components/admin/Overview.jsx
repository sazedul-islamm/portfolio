"use client";

import { useEffect, useState } from 'react';

export default function Overview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/admin/overview', {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load admin overview');
        }

        if (active) {
          setOverview(data);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load admin overview');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format date and time
  const formatDate = (date) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const kpis = [
    {
      title: 'Projects',
      value: loading ? '...' : String(overview?.summary?.projects ?? 0),
      change: overview?.source === 'd1' ? 'live' : 'local',
      trend: 'up',
      subtitle: 'portfolio records',
    },
    {
      title: 'Services',
      value: loading ? '...' : String(overview?.summary?.services ?? 0),
      change: overview?.source === 'd1' ? 'live' : 'local',
      trend: 'up',
      subtitle: 'service offerings',
    },
    {
      title: 'Messages',
      value: loading ? '...' : String(overview?.summary?.messages ?? 0),
      change: overview?.source === 'd1' ? 'live' : 'local',
      trend: 'up',
      subtitle: 'contact inbox',
    },
    {
      title: 'Settings',
      value: loading ? '...' : String(overview?.summary?.settings ?? 0),
      change: overview?.source === 'd1' ? 'live' : 'local',
      trend: 'down',
      subtitle: 'site config groups',
    },
  ];

  const activities = overview?.recentActivity ?? [];

  const systemStatuses = [
    {
      label: 'API Availability',
      value: loading ? '...' : `${overview?.systemStatus?.apiAvailability ?? 0}%`,
      color: 'bg-emerald-500',
    },
    {
      label: 'Content Completion',
      value: loading ? '...' : `${overview?.systemStatus?.contentCompletion ?? 0}%`,
      color: 'bg-sky-500',
    },
    {
      label: 'SEO Optimization',
      value: loading ? '...' : `${overview?.systemStatus?.seoOptimization ?? 0}%`,
      color: 'bg-violet-500',
    },
  ];

  const getWidthPercentage = (value) => {
    const num = parseInt(value);
    return isNaN(num) ? 0 : Math.min(num, 100);
  };

  const quickActions = [
    { label: 'Add New Project', note: 'Create and publish a fresh case study' },
    { label: 'Update Service Plans', note: 'Edit services, pricing, and value props' },
    { label: 'Review Messages', note: 'Check and respond to latest inquiries' },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Portfolio Control Center</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Executive Overview</h2>
            <p className="mt-1 text-sm text-slate-200">Monitor performance, content health, and key actions at a glance.</p>
          </div>
          <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">
            <p className="text-xs text-slate-200">Current Date & Time</p>
            <div className="mt-1">
              <p className="text-lg font-semibold">{formatDate(currentTime)}</p>
              <p className="text-sm font-mono text-slate-300">{formatTime(currentTime)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm text-slate-500">{kpi.title}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-semibold text-slate-900">{kpi.value}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {kpi.change}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{kpi.subtitle}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Live feed</span>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <ul className="space-y-4">
            {activities.length > 0 ? activities.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900" />
                <div className="w-full border-b border-slate-100 pb-4 last:border-none last:pb-0">
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                </div>
              </li>
            )) : (
              <li className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No recent activity yet.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">System Status</h3>
          <div className="mt-4 space-y-4">
            {systemStatuses.map((status) => (
              <div key={status.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{status.label}</span>
                  <span className="font-medium text-slate-800">{status.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${status.color}`}
                    style={{ width: `${getWidthPercentage(status.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          <span className="text-xs text-slate-400">Do more with fewer clicks</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
            >
              <p className="font-medium text-slate-800">{action.label}</p>
              <p className="mt-1 text-sm text-slate-500">{action.note}</p>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
