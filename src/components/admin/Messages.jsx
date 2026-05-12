"use client";

import { useEffect, useMemo, useState } from 'react';

const statusOptions = ['all', 'new', 'read', 'replied', 'archived'];

function normalizeStatus(status) {
  return String(status ?? '').toLowerCase();
}

function getReadState(status) {
  return normalizeStatus(status) === 'new' ? 'Unread' : 'Read';
}

function getMessageBody(message) {
  return String(message ?? '').split('\n\n---\n')[0].trim();
}

function getMessageMeta(message, key) {
  const match = String(message ?? '').match(new RegExp(`${key}:\\s*(.*)`, 'i'));
  return match?.[1]?.split('\n')[0]?.trim() ?? '';
}

function getServiceLabel(message) {
  return getMessageMeta(message, 'Service');
}

function getContactNumber(message) {
  return getMessageMeta(message, 'Phone');
}

function getDisplayService(message) {
  return getServiceLabel(message) || 'General inquiry';
}

export default function Messages() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/admin/messages?limit=50', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load messages');
        }

        if (active) {
          setData(payload);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load messages');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, []);

  const messages = useMemo(() => data?.items ?? [], [data]);

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return messages.filter((message) => {
      const serviceLabel = getDisplayService(message.message);
      const contactNumber = getContactNumber(message.message);

      const matchesTerm =
        !term ||
        [message.name, message.email, serviceLabel, contactNumber, message.subject, message.message]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'all' || String(message.status ?? '').toLowerCase() === statusFilter;

      return matchesTerm && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const selectedMessage = useMemo(
    () => filteredMessages.find((message) => message.id === selectedId) ?? filteredMessages[0] ?? null,
    [filteredMessages, selectedId]
  );

  const selectedService = selectedMessage ? getDisplayService(selectedMessage.message) : '';
  const selectedContactNumber = selectedMessage ? getContactNumber(selectedMessage.message) : '';
  const selectedBody = selectedMessage ? getMessageBody(selectedMessage.message) : '';

  useEffect(() => {
    if (!selectedMessage && filteredMessages.length > 0) {
      setSelectedId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessage]);

  async function refreshMessages() {
    const response = await fetch('/api/admin/messages?limit=50', { cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to load messages');
    }

    setData(payload);
  }

  async function updateStatus(id, status) {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update message status');
      }

      await refreshMessages();
      setSelectedId(id);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update message status');
    } finally {
      setLoading(false);
    }
  }

  async function deleteSelectedMessage(id) {
    if (!confirm('Delete this message?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete message');
      }

      await refreshMessages();
      setSelectedId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete message');
    } finally {
      setLoading(false);
    }
  }

  const summary = {
    total: messages.length,
    unread: messages.filter((message) => normalizeStatus(message.status) === 'new').length,
    replied: messages.filter((message) => normalizeStatus(message.status) === 'replied').length,
    archived: messages.filter((message) => normalizeStatus(message.status) === 'archived').length,
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Client communication</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Inbox</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              View and manage incoming contact messages from the portfolio contact form.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
              Export CSV
            </button>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Messages', value: loading ? '...' : String(summary.total), detail: 'all submissions' },
          { label: 'Unread', value: loading ? '...' : String(summary.unread), detail: 'needs attention' },
          { label: 'Replied', value: loading ? '...' : String(summary.replied), detail: 'followed up' },
          { label: 'Archived', value: loading ? '...' : String(summary.archived), detail: 'closed threads' },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Message List</h3>
              <p className="mt-1 text-sm text-slate-500">Review new leads, mark status, and keep the inbox organized.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search messages"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_minmax(0,1.2fr)_auto_minmax(0,1fr)_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Sender</span>
              <span>Service</span>
              <span>Contact</span>
              <span>Status</span>
              <span>Received</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    className={`grid w-full grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_minmax(0,1.2fr)_auto_minmax(0,1fr)_auto] items-start gap-4 px-4 py-4 text-left text-sm transition hover:bg-slate-50 ${
                      selectedId === message.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{message.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{message.email}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{getDisplayService(message.message)}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{message.subject || 'No subject'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{getContactNumber(message.message) || 'Not provided'}</p>
                      <p className="mt-1 line-clamp-1 max-w-[42ch] text-xs text-slate-500">{getMessageBody(message.message)}</p>
                    </div>
                    <div className="pt-0.5">
                      <div className="space-y-1">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          normalizeStatus(message.status) === 'new'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {getReadState(message.status)}
                        </span>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{message.status}</p>
                      </div>
                    </div>
                    <div className="pt-0.5 text-slate-500">
                      <p className="whitespace-nowrap">{message.createdAt ? new Date(message.createdAt).toLocaleString() : 'recently'}</p>
                    </div>
                    <div className="pt-0.5 text-right text-slate-600">
                      <span className="whitespace-nowrap font-medium">Open</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-sm text-slate-500">
                  {loading ? 'Loading messages...' : 'No messages found.'}
                </div>
              )}
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Message Detail</h3>
                <p className="mt-1 text-sm text-slate-500">Selected conversation thread.</p>
              </div>
              {selectedMessage ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {selectedMessage.status}
                </span>
              ) : null}
            </div>

            {selectedMessage ? (
              <div className="mt-4 space-y-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Name', value: selectedMessage.name },
                    { label: 'Email', value: selectedMessage.email },
                    { label: 'Service', value: selectedService || 'General inquiry' },
                    { label: 'Contact Number', value: selectedContactNumber || 'Not provided' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Read State</p>
                    <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      normalizeStatus(selectedMessage.status) === 'new'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {getReadState(selectedMessage.status)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{selectedMessage.status}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Received</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : 'recently'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedBody || selectedMessage.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, 'read')}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Mark Read
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, 'replied')}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Mark Replied
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSelectedMessage(selectedMessage.id)}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Delete Message
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Select a message to view its full conversation.
              </div>
            )}
          </article>

        </aside>
      </div>
    </section>
  );
}