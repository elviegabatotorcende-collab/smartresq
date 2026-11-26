import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { onNotification } from '../live';

const changed = () => window.dispatchEvent(new Event('notifications:changed'));

const TYPES = {
  Critical: { c: '#d92d20', icon: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" /> },
  Dispatch: { c: '#7a5af8', icon: <path d="M3 11l18-8-8 18-2.5-7.5z" /> },
  Status: { c: '#2e90fa', icon: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></> },
  System: { c: '#667085', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></> },
};

const css = `
.nt, .nt * { box-sizing: border-box; }
.nt { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 820px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.nt h1, .nt h2, .nt p { margin: 0; }

.nt-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.nt-head h1 { font-size: 1.5rem; color: var(--navy); }
.nt-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }
.nt-all { padding: 9px 16px; border-radius: 10px; border: 1px solid #c7d2f0; background: #eef2ff; color: var(--blue); font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
.nt-all:hover { background: #e0e7ff; }

.nt-tabs { display: flex; gap: 6px; }
.nt-tab { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: #475467; font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
.nt-tab.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.nt-tab b { margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: var(--gold); color: var(--navy); font-size: .72rem; }

.nt-group h2 { margin: 4px 0 8px; font-size: .74rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.nt-list { display: flex; flex-direction: column; gap: 8px; }
.nt-item { position: relative; display: flex; align-items: flex-start; gap: 13px; width: 100%; padding: 14px 16px; text-align: left; font: inherit; color: inherit;
  background: #fff; border: 1px solid var(--line); border-radius: 14px; cursor: pointer; transition: transform .12s, box-shadow .15s, border-color .15s; }
.nt-item:hover { transform: translateY(-1px); border-color: #c7d2f0; box-shadow: 0 6px 18px rgba(15,37,87,.1); }
.nt-item.unread { background: #fbfcff; border-left: 4px solid var(--c); }
.nt-ico { width: 40px; height: 40px; flex-shrink: 0; display: grid; place-items: center; border-radius: 12px; color: var(--c); background: color-mix(in srgb, var(--c) 13%, #fff); }
.nt-body { flex: 1; min-width: 0; }
.nt-msg { display: block; font-size: .94rem; line-height: 1.45; word-break: break-word; }
.nt-item.unread .nt-msg { font-weight: 700; }
.nt-item:not(.unread) .nt-msg { color: #475467; }
.nt-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: .78rem; color: var(--muted); }
.nt-tag { padding: 1px 8px; border-radius: 999px; font-size: .68rem; font-weight: 800; letter-spacing: .04em; color: var(--c); background: color-mix(in srgb, var(--c) 13%, #fff); }
.nt-dot { width: 9px; height: 9px; margin-top: 6px; flex-shrink: 0; border-radius: 50%; background: var(--c); }
.nt-go { margin-top: 2px; color: #98a2b3; flex-shrink: 0; align-self: center; }

.nt-empty { padding: 48px 20px; text-align: center; color: var(--muted); background: #fff; border: 1px dashed #d0d5dd; border-radius: 16px; }
.nt-empty svg { display: block; margin: 0 auto 10px; color: #98a2b3; }
@media (prefers-reduced-motion: reduce) { .nt-item { transition: none; } }
`;

function ago(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function dayGroup(d) {
  const t = new Date(d);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ms = t.getTime();
  if (ms >= startToday) return 'Today';
  if (ms >= startToday - 86400000) return 'Yesterday';
  return 'Earlier';
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('all');

  const load = useCallback(
    () => api.get('/notifications').then((r) => setItems(r.data.notifications)).catch(() => {}),
    []
  );

  useEffect(() => {
    load();
    return onNotification(load); // new notification arrives while this page is open
  }, [load]);

  const target = (n) =>
    n.reportid ? (user.role === 1 ? `/resident/incident/${n.reportid}` : `/staff/reports/${n.reportid}`) : null;

  async function open(n) {
    if (!n.isread) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
      changed();
    }
    const to = target(n);
    if (to) navigate(to);
    else load();
  }

  async function markAll() {
    await api.patch('/notifications/read-all').catch(() => {});
    changed();
    load();
  }

  const unreadCount = items?.filter((n) => !n.isread).length || 0;

  const groups = useMemo(() => {
    if (!items) return [];
    const list = tab === 'unread' ? items.filter((n) => !n.isread) : items;
    const order = ['Today', 'Yesterday', 'Earlier'];
    return order
      .map((g) => ({ name: g, rows: list.filter((n) => dayGroup(n.datecreated) === g) }))
      .filter((g) => g.rows.length);
  }, [items, tab]);

  const isResident = user.role === 1;

  return (
    <div className="nt">
      <style>{css}</style>

      <div className="nt-head">
        <div>
          <h1>{isResident ? 'Notifications' : 'Incident Notifications'}</h1>
          <p>{isResident ? 'Stay informed about your incidents.' : 'Updates on reports, dispatches and critical incidents.'}</p>
        </div>
        {unreadCount > 0 && <button className="nt-all" onClick={markAll}>Mark all as read</button>}
      </div>

      <div className="nt-tabs">
        <button className={`nt-tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>All</button>
        <button className={`nt-tab ${tab === 'unread' ? 'on' : ''}`} onClick={() => setTab('unread')}>
          Unread{unreadCount > 0 && <b>{unreadCount}</b>}
        </button>
      </div>

      {items === null && <p style={{ color: '#667085' }}>Loading...</p>}

      {items && groups.length === 0 && (
        <div className="nt-empty">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 004 0" />
          </svg>
          {tab === 'unread' ? "You're all caught up." : 'No notifications yet.'}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.name} className="nt-group">
          <h2>{g.name}</h2>
          <div className="nt-list">
            {g.rows.map((n) => {
              const t = TYPES[n.type] || TYPES.System;
              return (
                <button key={n.id} className={`nt-item ${n.isread ? '' : 'unread'}`} style={{ '--c': t.c }} onClick={() => open(n)}>
                  <span className="nt-ico">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
                  </span>
                  <span className="nt-body">
                    <span className="nt-msg">{n.message}</span>
                    <span className="nt-meta">
                      <span className="nt-tag">{(n.type || 'System').toUpperCase()}</span>
                      {ago(n.datecreated)}
                    </span>
                  </span>
                  {!n.isread && <i className="nt-dot" aria-label="Unread" />}
                  {target(n) && (
                    <svg className="nt-go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}