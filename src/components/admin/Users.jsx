"use client";

export default function Users() {
  const users = [
    {
      name: 'Sabrina Khan',
      email: 'sabrina@clientmail.com',
      role: 'Client',
      status: 'Active',
      plan: 'Premium',
      lastSeen: '2 min ago',
    },
    {
      name: 'Omar Rahman',
      email: 'omar@startup.io',
      role: 'Partner',
      status: 'Pending',
      plan: 'Standard',
      lastSeen: '18 min ago',
    },
    {
      name: 'Amina Chowdhury',
      email: 'amina@studio.co',
      role: 'Client',
      status: 'Active',
      plan: 'Enterprise',
      lastSeen: '1 hour ago',
    },
    {
      name: 'Mehedi Hasan',
      email: 'mehedi@productlabs.dev',
      role: 'Guest',
      status: 'Inactive',
      plan: 'Basic',
      lastSeen: 'Yesterday',
    },
  ];

  const metrics = [
    { label: 'Total Users', value: '128', detail: '+14 this month' },
    { label: 'Active Now', value: '36', detail: '28% online rate' },
    { label: 'Pending Approvals', value: '7', detail: 'Needs admin review' },
    { label: 'VIP Accounts', value: '12', detail: 'High-value relationships' },
  ];

  const recentNotes = [
    'New user invitation sent to design team lead.',
    'Profile for Amina Chowdhury updated successfully.',
    'Two accounts are waiting for onboarding approval.',
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">People & Access</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Users Management</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Track client accounts, monitor access levels, and keep relationships organized from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
              Export CSV
            </button>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              Invite User
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">User Directory</h3>
              <p className="mt-1 text-sm text-slate-500">Filter accounts, review access roles, and manage onboarding status.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search users"
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
              <select className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white">
                <option>All Roles</option>
                <option>Client</option>
                <option>Partner</option>
                <option>Guest</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Plan</span>
              <span>Last Seen</span>
            </div>

            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.email} className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 px-4 py-4 text-sm text-slate-700 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{user.role}</span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : user.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-600">{user.plan}</div>
                  <div className="flex items-center text-slate-500">{user.lastSeen}</div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Selected Profile</h3>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Amina Chowdhury</p>
              <p className="mt-1 text-sm text-slate-500">amina@studio.co</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">Client</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Active</span>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">Enterprise</span>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>Account created</span>
                  <span className="font-medium text-slate-800">12 Jan 2025</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Last login</span>
                  <span className="font-medium text-slate-800">1 hour ago</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Open tasks</span>
                  <span className="font-medium text-slate-800">4</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Edit Profile</button>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Message User</button>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Recent Notes</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {recentNotes.map((note) => (
                <li key={note} className="rounded-xl bg-slate-50 px-4 py-3 leading-6 text-slate-600">
                  {note}
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}
