import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const css = `
.su, .su * { box-sizing: border-box; }
.su { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  display: flex; flex-direction: column; gap: 16px; max-width: 1100px; margin: 0 auto; color: var(--ink); font-family: inherit; }
.su h1, .su h2, .su p { margin: 0; }

.su-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.su-head h1 { font-size: 1.5rem; color: var(--navy); }
.su-head p { color: var(--muted); font-size: .92rem; margin-top: 2px; }
.su-add { padding: 11px 20px; border: none; border-radius: 12px; cursor: pointer; color: #fff; font: inherit; font-weight: 800;
  background: linear-gradient(135deg, var(--blue), var(--navy)); box-shadow: 0 6px 16px rgba(15,37,87,.3); }
.su-add:hover { transform: translateY(-1px); }

.su-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.su-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.su-tab { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: #475467; font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
.su-tab.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.su-search { flex: 1 1 200px; min-width: 160px; padding: 10px 14px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.su-search:focus, .su-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }

.su-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); overflow-x: auto; }
.su-table { width: 100%; border-collapse: collapse; font-size: .92rem; }
.su-table th { text-align: left; padding: 12px 16px; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); background: #f9fafb; border-bottom: 1px solid var(--line); }
.su-table td { padding: 14px 16px; border-bottom: 1px solid #f2f4f7; vertical-align: middle; }
.su-table tr:last-child td { border-bottom: 0; }
.su-name strong { display: block; }
.su-name span { display: block; font-size: .8rem; color: var(--muted); }
.su-pill { display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: .75rem; font-weight: 700; background: #eef2ff; color: var(--blue); }
.su-pill.green { background: #ecfdf3; color: #067647; }
.su-pill.gray { background: #f2f4f7; color: #667085; }
.su-pill.amber { background: #fffaeb; color: #b54708; }
.su-acts { display: flex; gap: 6px; flex-wrap: wrap; }
.su-link { padding: 6px 12px; border-radius: 8px; border: 1px solid #d0d5dd; background: #fff; color: #344054; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
.su-link:hover { background: #f9fafb; }
.su-link.danger { color: #b42318; border-color: #fecdca; }
.su-link.ok { color: #067647; border-color: #abefc6; }
.su-empty { padding: 30px; text-align: center; color: var(--muted); }

.su-toast { position: fixed; right: 16px; bottom: 16px; z-index: 300; padding: 12px 16px; border-radius: 12px; background: var(--navy); color: #fff; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.su-toast.err { background: #b42318; }

.su-modal { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 16px; background: rgba(15,37,87,.55); }
.su-dialog { width: 100%; max-width: 440px; max-height: 92vh; overflow-y: auto; padding: 24px; background: #fff; border-radius: 18px; border-top: 5px solid var(--gold); box-shadow: 0 20px 50px rgba(0,0,0,.35); }
.su-dialog h2 { font-size: 1.2rem; color: var(--navy); margin-bottom: 4px; }
.su-dialog > p { color: var(--muted); font-size: .9rem; margin-bottom: 10px; }
.su-label { display: block; font-size: .82rem; font-weight: 600; color: #344054; margin: 12px 0 5px; }
.su-input { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.su-error { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
.su-btns { display: flex; gap: 10px; margin-top: 20px; }
.su-btns button { flex: 1; padding: 12px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
.su-cancel { background: #fff; border: 1.5px solid #d0d5dd; color: #344054; }
.su-save { border: none; color: #fff; background: linear-gradient(135deg, var(--blue), var(--navy)); }
.su-save.danger { background: linear-gradient(135deg, #f04438, #d92d20); }
.su-save:disabled { opacity: .6; cursor: not-allowed; }
`;

const ROLE_TABS = [['all', 'All'], ['3', 'Officials'], ['4', 'Responders'], ['1', 'Residents']];
const STAFF_ROLES = [['3', 'Barangay Official'], ['4', 'Barangay Responder']];

export default function StaffUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // { mode, user }
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  const load = () =>
    api.get('/users')
      .then((r) => { setUsers(r.data); setError(''); })
      .catch((e) => setError(e.response?.data?.error || `Cannot load users (${e.message})`));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const shown = useMemo(() => {
    if (!users) return [];
    const term = q.trim().toLowerCase();
    return users.filter((u) =>
      (tab === 'all' || String(u.role) === tab) &&
      (!term || [u.fullname, u.email, u.contactno].some((v) => (v || '').toLowerCase().includes(term)))
    );
  }, [users, tab, q]);

  function open(mode, user = null) {
    setFormError('');
    setForm(
      mode === 'add'
        ? { fullname: '', email: '', contactno: '', role: '3', password: '' }
        : mode === 'edit'
          ? { fullname: user.fullname, email: user.email || '', contactno: user.contactno || '', role: String(user.role) }
          : { password: '' }
    );
    setModal({ mode, user });
  }
  const close = () => setModal(null);
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const { mode, user } = modal;
      if (mode === 'add') {
        await api.post('/users', form);
        setToast({ text: 'Account created' });
      } else if (mode === 'edit') {
        const body = { fullname: form.fullname, email: form.email, contactno: form.contactno };
        if ([3, 4].includes(user.role)) body.role = Number(form.role);
        await api.patch(`/users/${user.id}`, body);
        setToast({ text: 'Changes saved' });
      } else if (mode === 'password') {
        await api.post(`/users/${user.id}/password`, { password: form.password });
        setToast({ text: 'Password updated' });
      } else if (mode === 'toggle') {
        await api.patch(`/users/${user.id}`, { status: user.status === 1 ? 0 : 1 });
        setToast({ text: user.status === 1 ? 'Account disabled' : 'Account enabled' });
      }
      close();
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  const title = modal && {
    add: 'Add user',
    edit: 'Edit user',
    password: 'Reset password',
    toggle: modal.user?.status === 1 ? 'Disable account?' : 'Enable account?',
  }[modal.mode];

  return (
    <div className="su">
      <style>{css}</style>

      <div className="su-head">
        <div>
          <h1>User Management</h1>
          <p>Manage the accounts and staff access of your barangay.</p>
        </div>
        <button className="su-add" onClick={() => open('add')}>+ Add user</button>
      </div>

      <div className="su-bar">
        <div className="su-tabs">
          {ROLE_TABS.map(([k, label]) => (
            <button key={k} className={`su-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <input className="su-search" placeholder="Search name, email or number" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <div className="su-error" role="alert">{error}</div>}

      <div className="su-card">
        <table className="su-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users && shown.length === 0 && (
              <tr><td colSpan="4" className="su-empty">No users found.</td></tr>
            )}
            {shown.map((u) => (
              <tr key={u.id}>
                <td className="su-name">
                  <strong>{u.fullname}</strong>
                  <span>{u.email}{u.contactno ? ` · ${u.contactno}` : ''}</span>
                </td>
                <td>
                  <span className="su-pill">{u.rolename}</span>{' '}
                  {u.role === 4 && <span className={`su-pill ${u.availability === 'On Duty' ? 'amber' : 'green'}`}>{u.availability}</span>}
                </td>
                <td><span className={`su-pill ${u.status === 1 ? 'green' : 'gray'}`}>{u.status === 1 ? 'Active' : 'Disabled'}</span></td>
                <td>
                  <div className="su-acts">
                    <button className="su-link" onClick={() => open('edit', u)}>Edit</button>
                    <button className="su-link" onClick={() => open('password', u)}>Password</button>
                    <button className={`su-link ${u.status === 1 ? 'danger' : 'ok'}`} onClick={() => open('toggle', u)}>
                      {u.status === 1 ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="su-modal" onClick={close}>
          <form className="su-dialog" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <h2>{title}</h2>

            {modal.mode === 'toggle' && (
              <p>
                {modal.user.status === 1
                  ? `${modal.user.fullname} will no longer be able to log in.`
                  : `${modal.user.fullname} will be able to log in again.`}
              </p>
            )}
            {modal.mode === 'password' && <p>Set a new password for {modal.user.fullname} (at least 8 characters).</p>}

            {(modal.mode === 'add' || modal.mode === 'edit') && (
              <>
                <label className="su-label">Full name</label>
                <input className="su-input" value={form.fullname} onChange={f('fullname')} required />
                <label className="su-label">Email</label>
                <input className="su-input" type="email" value={form.email} onChange={f('email')} required />
                <label className="su-label">Mobile number</label>
                <input className="su-input" value={form.contactno} onChange={f('contactno')} required />
                {(modal.mode === 'add' || [3, 4].includes(modal.user?.role)) && (
                  <>
                    <label className="su-label">Role</label>
                    <select className="su-input" value={form.role} onChange={f('role')}>
                      {STAFF_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </>
                )}
              </>
            )}

            {(modal.mode === 'add' || modal.mode === 'password') && (
              <>
                <label className="su-label">{modal.mode === 'add' ? 'Temporary password' : 'New password'}</label>
                <input className="su-input" type="password" minLength={8} value={form.password} onChange={f('password')} required autoComplete="new-password" />
              </>
            )}

            {formError && <div className="su-error" role="alert">{formError}</div>}

            <div className="su-btns">
              <button type="button" className="su-cancel" onClick={close}>Cancel</button>
              <button className={`su-save ${modal.mode === 'toggle' && modal.user.status === 1 ? 'danger' : ''}`} disabled={busy}>
                {busy ? 'Saving...' : modal.mode === 'toggle' ? 'Confirm' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className={`su-toast ${toast.err ? 'err' : ''}`} role="status">{toast.text}</div>}
    </div>
  );
}