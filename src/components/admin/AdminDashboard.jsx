"use client";

import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Overview from './Overview';
import Messages from './Messages';
import Users from './Users';
import Projects from './Projects';
import Services from './Services';
import Stats from './Stats';
import Settings from './Settings';

function LoginForm({ onLogin }) {
  const [pass, setPass] = useState('');
  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Admin Login</h3>
      <p className="text-sm text-slate-500 mb-4">Enter admin password to access the dashboard.</p>
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded mb-3"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onLogin(pass)}
          className="px-4 py-2 bg-slate-800 text-white rounded"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [active, setActive] = useState('overview');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    try {
      setAuthenticated(sessionStorage.getItem('isAdmin') === 'true');
    } catch (e) {
      setAuthenticated(false);
    }
  }, []);

  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin';

  function handleLogin(pass) {
    if (pass === ADMIN_PASS) {
      try { sessionStorage.setItem('isAdmin', 'true'); } catch (e) { console.warn('sessionStorage.setItem failed', e); }
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  }

  function handleLogout() {
    try { sessionStorage.removeItem('isAdmin'); } catch (e) { console.warn('sessionStorage.removeItem failed', e); }
    setAuthenticated(false);
  }

  if (!authenticated) return <LoginForm onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active={active} setActive={setActive} />

      <main className="flex-1 p-8 bg-slate-50">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div>
            <button onClick={handleLogout} className="px-3 py-1 bg-white border rounded">Logout</button>
          </div>
        </div>

        <div className="bg-transparent">
          {active === 'overview' && <Overview />}
          {active === 'messages' && <Messages />}
          {active === 'users' && <Users />}
          {active === 'projects' && <Projects />}
          {active === 'services' && <Services />}
          {active === 'stats' && <Stats />}
          {active === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}
