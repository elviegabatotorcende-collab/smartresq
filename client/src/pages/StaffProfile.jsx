import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import PhotoPicker from '../components/PhotoPicker';

const css = `
.pr, .pr * { box-sizing: border-box; }
.pr { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; color: var(--ink); font-family: inherit; }
.pr h1, .pr h2, .pr p { margin: 0; }

.pr-banner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
  padding: 28px 24px 64px; border-radius: 20px; color: #fff;
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy));
  border-bottom: 4px solid var(--gold); }
.pr-eyebrow { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.pr-banner h1 { font-size: 1.5rem; color: #fff; }

.pr-card { position: relative; margin: -48px 16px 0; padding: 0 22px 22px; background: #fff; border: 1px solid var(--line);
  border-radius: 18px; box-shadow: 0 10px 28px rgba(15,37,87,.14); }
.pr-avatar { width: 88px; height: 88px; margin: -44px auto 10px; display: grid; place-items: center; border-radius: 50%;
  background: linear-gradient(135deg, var(--blue), var(--navy)); color: #fff; font-size: 1.9rem; font-weight: 800;
  border: 4px solid #fff; box-shadow: 0 6px 16px rgba(0,0,0,.2), 0 0 0 3px var(--gold); }
.pr-name { text-align: center; font-size: 1.3rem; }
.pr-role { display: block; width: fit-content; margin: 8px auto 6px; padding: 4px 14px; border-radius: 999px;
  background: #eef2ff; color: var(--blue); font-size: .8rem; font-weight: 700; }

.pr-row { display: flex; justify-content: space-between; gap: 16px; padding: 14px 4px; border-top: 1px solid var(--line); }
.pr-row dt { color: var(--muted); font-size: .88rem; }
.pr-row dd { margin: 0; font-weight: 600; text-align: right; word-break: break-word; }

.pr-box { padding: 22px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
.pr-box h2 { font-size: 1.05rem; color: var(--navy); margin-bottom: 4px; }
.pr-box > p { color: var(--muted); font-size: .88rem; margin-bottom: 6px; }
.pr-label { display: block; font-size: .82rem; font-weight: 600; color: #344054; margin: 12px 0 5px; }
.pr-input { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.pr-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.pr-btn { margin-top: 16px; padding: 12px 22px; border: none; border-radius: 10px; color: #fff; font: inherit; font-weight: 700; cursor: pointer;
  background: linear-gradient(135deg, var(--blue), var(--navy)); }
.pr-btn:disabled { opacity: .6; cursor: not-allowed; }
.pr-msg { margin-top: 12px; padding: 10px 12px; border-radius: 10px; font-size: .88rem; }
.pr-msg.ok { background: #ecfdf3; border: 1px solid #abefc6; color: #067647; }
.pr-msg.err { background: #fef3f2; border: 1px solid #fecdca; color: #b42318; }
`;

function Msg({ m }) {
  return m ? <div className={`pr-msg ${m.ok ? 'ok' : 'err'}`} role="status">{m.text}</div> : null;
}

export default function StaffProfile() {
  const { user } = useAuth();
  const [barangay, setBarangay] = useState('');
  const [form, setForm] = useState({ fullname: user.fullname || '', email: user.email || '', contactno: user.contactno || '' });
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const [busy, setBusy] = useState('');
  const [infoMsg, setInfoMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    api.get('/incidents/meta')
      .then((r) => setBarangay((r.data.barangays || []).find((b) => String(b.id) === String(user.barangay))?.barangayname || ''))
      .catch(() => {});
  }, [user.barangay]);

  const initials = (user.fullname || 'U').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const p = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  async function saveInfo(e) {
    e.preventDefault();
    setBusy('info'); setInfoMsg(null);
    try {
      await api.patch('/profile', form);
      setInfoMsg({ ok: true, text: 'Saved. Refreshing your details...' });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setInfoMsg({ text: err.response?.data?.error || err.message });
    } finally { setBusy(''); }
  }

  async function savePw(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.password !== pw.confirm) return setPwMsg({ text: 'New passwords do not match' });
    setBusy('pw');
    try {
      await api.post('/profile/password', { current: pw.current, password: pw.password });
      setPw({ current: '', password: '', confirm: '' });
      setPwMsg({ ok: true, text: 'Password changed' });
    } catch (err) {
      setPwMsg({ text: err.response?.data?.error || err.message });
    } finally { setBusy(''); }
  }

  const rows = [['Role', user.rolename], ['Barangay', barangay || (user.role === 5 ? 'All barangays' : '')]];

  return (
    <div className="pr">
      <style>{css}</style>

      <header className="pr-banner">
        <p className="pr-eyebrow">SmartResQ · Staff Portal</p>
        <h1>My Profile</h1>
      </header>

      <section className="pr-card">
        <PhotoPicker />
        <h2 className="pr-name">{user.fullname}</h2>
        <span className="pr-role">{user.rolename}</span>
        <dl style={{ margin: 0 }}>
          {rows.map(([l, v]) => (
            <div key={l} className="pr-row"><dt>{l}</dt><dd>{v || '—'}</dd></div>
          ))}
        </dl>
      </section>

      <form className="pr-box" onSubmit={saveInfo}>
        <h2>Edit details</h2>
        <p>Your name and contact information.</p>
        <label className="pr-label">Full name</label>
        <input className="pr-input" value={form.fullname} onChange={f('fullname')} required />
        <label className="pr-label">Email</label>
        <input className="pr-input" type="email" value={form.email} onChange={f('email')} required />
        <label className="pr-label">Mobile number</label>
        <input className="pr-input" value={form.contactno} onChange={f('contactno')} required />
        <Msg m={infoMsg} />
        <button className="pr-btn" disabled={busy === 'info'}>{busy === 'info' ? 'Saving...' : 'Save changes'}</button>
      </form>

      <form className="pr-box" onSubmit={savePw}>
        <h2>Change password</h2>
        <p>At least 8 characters.</p>
        <label className="pr-label">Current password</label>
        <input className="pr-input" type="password" value={pw.current} onChange={p('current')} required autoComplete="current-password" />
        <label className="pr-label">New password</label>
        <input className="pr-input" type="password" minLength={8} value={pw.password} onChange={p('password')} required autoComplete="new-password" />
        <label className="pr-label">Confirm new password</label>
        <input className="pr-input" type="password" minLength={8} value={pw.confirm} onChange={p('confirm')} required autoComplete="new-password" />
        <Msg m={pwMsg} />
        <button className="pr-btn" disabled={busy === 'pw'}>{busy === 'pw' ? 'Saving...' : 'Change password'}</button>
      </form>
    </div>
  );
}