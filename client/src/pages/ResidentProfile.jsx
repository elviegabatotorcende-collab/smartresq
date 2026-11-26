import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import logo from '../assets/logo.webp';
import PhotoPicker from '../components/PhotoPicker';

const css = `
.pf, .pf * { box-sizing: border-box; }
.pf { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --ink:#1d2939; --muted:#667085; --line:#e4e7ec;
  max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; color: var(--ink); font-family: inherit; }
.pf h1, .pf h2, .pf p { margin: 0; }

.pf-banner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
  padding: 28px 24px 64px; border-radius: 20px; color: #fff;
  background: radial-gradient(circle at 100% 0%, rgba(245,179,1,.28), transparent 42%), linear-gradient(135deg, var(--blue), var(--navy));
  border-bottom: 4px solid var(--gold); }
.pf-eyebrow { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.pf-banner h1 { font-size: 1.5rem; color: #fff; }

.pf-card { position: relative; margin: -48px 16px 0; padding: 0 22px 22px; background: #fff; border: 1px solid var(--line);
  border-radius: 18px; box-shadow: 0 10px 28px rgba(15,37,87,.14); }
.pf-avatar { width: 88px; height: 88px; margin: -44px auto 10px; display: grid; place-items: center; border-radius: 50%;
  background: linear-gradient(135deg, #f04438, #b42318); color: #fff; font-size: 1.9rem; font-weight: 800;
  border: 4px solid #fff; box-shadow: 0 6px 16px rgba(0,0,0,.2), 0 0 0 3px var(--gold); }
.pf-name { text-align: center; font-size: 1.3rem; }
.pf-role { display: block; width: fit-content; margin: 8px auto 18px; padding: 4px 14px; border-radius: 999px;
  background: #eef2ff; color: var(--blue); font-size: .8rem; font-weight: 700; }

.pf-row { display: flex; justify-content: space-between; gap: 16px; padding: 14px 4px; border-top: 1px solid var(--line); }
.pf-row dt { color: var(--muted); font-size: .88rem; }
.pf-row dd { margin: 0; font-weight: 600; text-align: right; word-break: break-word; }

.pf-box { padding: 22px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
.pf-box h2 { font-size: 1.05rem; color: var(--navy); margin-bottom: 4px; }
.pf-box > p { color: var(--muted); font-size: .88rem; margin-bottom: 6px; }
.pf-label { display: block; font-size: .82rem; font-weight: 600; color: #344054; margin: 12px 0 5px; }
.pf-input { width: 100%; padding: 11px 13px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.pf-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.pf-btn { margin-top: 16px; padding: 12px 22px; border: none; border-radius: 10px; color: #fff; font: inherit; font-weight: 700; cursor: pointer;
  background: linear-gradient(135deg, var(--blue), var(--navy)); }
.pf-btn:disabled { opacity: .6; cursor: not-allowed; }
.pf-msg { margin-top: 12px; padding: 10px 12px; border-radius: 10px; font-size: .88rem; }
.pf-msg.ok { background: #ecfdf3; border: 1px solid #abefc6; color: #067647; }
.pf-msg.err { background: #fef3f2; border: 1px solid #fecdca; color: #b42318; }

.pf-seal { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border: 1px solid var(--line);
  border-left: 5px solid var(--gold); border-radius: 14px; }
.pf-seal img { width: 48px; height: 48px; object-fit: contain; }
.pf-seal p { font-size: .88rem; color: var(--muted); line-height: 1.4; }
.pf-seal strong { color: var(--navy); }
`;

function Msg({ m }) {
  return m ? <div className={`pf-msg ${m.ok ? 'ok' : 'err'}`} role="status">{m.text}</div> : null;
}

export default function ResidentProfile() {
  const { user } = useAuth();
  const [barangays, setBarangays] = useState([]);
  const [form, setForm] = useState({ fullname: user.fullname || '', email: user.email || '', contactno: user.contactno || '' });
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const [busy, setBusy] = useState('');
  const [infoMsg, setInfoMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    api.get('/incidents/meta').then((r) => setBarangays(r.data.barangays || [])).catch(() => {});
  }, []);

  const fullname = user.fullname || 'Resident';
  const initials = fullname.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const barangay = barangays.find((b) => String(b.id) === String(user.barangay))?.barangayname;

  const rows = [
    ['Full name', fullname],
    ['Email', user.email],
    ['Mobile number', user.contactno],
    ['Barangay', barangay],
  ];

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

  return (
    <div className="pf">
      <style>{css}</style>

      <header className="pf-banner">
        <p className="pf-eyebrow">SmartResQ · Resident Portal</p>
        <h1>My Profile</h1>
      </header>

      <section className="pf-card">
       <PhotoPicker />
        <h2 className="pf-name">{fullname}</h2>
        <span className="pf-role">Resident</span>

        <dl style={{ margin: 0 }}>
          {rows.map(([label, value]) => (
            <div key={label} className="pf-row">
              <dt>{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form className="pf-box" onSubmit={saveInfo}>
        <h2>Edit details</h2>
        <p>Keep your contact details up to date so responders can reach you.</p>
        <label className="pf-label">Full name</label>
        <input className="pf-input" value={form.fullname} onChange={f('fullname')} required />
        <label className="pf-label">Email</label>
        <input className="pf-input" type="email" value={form.email} onChange={f('email')} required />
        <label className="pf-label">Mobile number</label>
        <input className="pf-input" value={form.contactno} onChange={f('contactno')} required />
        <Msg m={infoMsg} />
        <button className="pf-btn" disabled={busy === 'info'}>{busy === 'info' ? 'Saving...' : 'Save changes'}</button>
      </form>

      <form className="pf-box" onSubmit={savePw}>
        <h2>Change password</h2>
        <p>At least 8 characters.</p>
        <label className="pf-label">Current password</label>
        <input className="pf-input" type="password" value={pw.current} onChange={p('current')} required autoComplete="current-password" />
        <label className="pf-label">New password</label>
        <input className="pf-input" type="password" minLength={8} value={pw.password} onChange={p('password')} required autoComplete="new-password" />
        <label className="pf-label">Confirm new password</label>
        <input className="pf-input" type="password" minLength={8} value={pw.confirm} onChange={p('confirm')} required autoComplete="new-password" />
        <Msg m={pwMsg} />
        <button className="pf-btn" disabled={busy === 'pw'}>{busy === 'pw' ? 'Saving...' : 'Change password'}</button>
      </form>

      <section className="pf-seal">
        <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" />
        <p>
          <strong>SmartResQ</strong> · Municipality of President Carlos P. Garcia, Bohol.
          Your details are used only to send and track your emergency reports.
        </p>
      </section>
    </div>
  );
}