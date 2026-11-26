import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/logo.webp';

const css = `
.rg, .rg * { box-sizing: border-box; }
.rg { --navy:#0f2557; --blue:#1f3a93; --gold:#f5b301; --red:#d92d20; --ink:#1d2939; --muted:#667085;
  min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; font-family: inherit; color: var(--ink);
  background: radial-gradient(circle at 15% 10%, rgba(245,179,1,.22), transparent 38%), linear-gradient(135deg, var(--blue), var(--navy)); }
.rg-card { width: 100%; max-width: 520px; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.35); }
.rg-head { display: flex; align-items: center; gap: 14px; padding: 22px 26px; color: #fff; border-bottom: 4px solid var(--gold);
  background: linear-gradient(135deg, var(--blue), var(--navy)); }
.rg-head img { width: 62px; height: 62px; flex-shrink: 0; object-fit: contain; background: #fff; border-radius: 50%; padding: 3px; box-shadow: 0 0 0 3px var(--gold); }
.rg-head p { margin: 0; }
.rg-eyebrow { font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.rg-head h1 { margin: 2px 0 0; font-size: 1.35rem; color: #fff; }
.rg-sub { font-size: .8rem; color: rgba(255,255,255,.8); margin-top: 2px !important; }

.rg-form { padding: 24px 26px 26px; }
.rg-intro { margin: 0 0 4px; color: var(--muted); font-size: .92rem; }
.rg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.rg-full { grid-column: 1 / -1; }
@media (max-width: 520px) { .rg-grid { grid-template-columns: 1fr; } }
.rg-label { display: block; margin: 14px 0 5px; font-size: .82rem; font-weight: 600; color: #344054; }
.rg-input { width: 100%; padding: 12px 14px; border: 1px solid #d0d5dd; border-radius: 10px; font: inherit; background: #fff; }
.rg-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 4px rgba(31,58,147,.15); }
.rg-pw { position: relative; }
.rg-pw .rg-input { padding-right: 62px; }
.rg-eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); padding: 5px 9px; border: 0; border-radius: 7px; background: #f2f4f7; color: #475467; font: inherit; font-size: .74rem; font-weight: 700; cursor: pointer; }
.rg-hint { margin-top: 5px; font-size: .78rem; color: var(--muted); }
.rg-hint.bad { color: var(--red); }
.rg-hint.good { color: #067647; }

.rg-error { margin-top: 16px; padding: 10px 12px; border-radius: 10px; background: #fef3f2; border: 1px solid #fecdca; color: #b42318; font-size: .88rem; }
.rg-ok { margin-top: 16px; padding: 10px 12px; border-radius: 10px; background: #ecfdf3; border: 1px solid #abefc6; color: #067647; font-size: .88rem; font-weight: 600; }
.rg-btn { width: 100%; margin-top: 20px; padding: 14px; border: none; border-radius: 12px; color: #fff; font: inherit; font-weight: 800; letter-spacing: .03em; cursor: pointer;
  background: linear-gradient(135deg, var(--blue), var(--navy)); box-shadow: 0 8px 20px rgba(15,37,87,.3); }
.rg-btn:hover:not(:disabled) { transform: translateY(-1px); }
.rg-btn:disabled { opacity: .6; cursor: not-allowed; }
.rg-links { margin-top: 18px; text-align: center; font-size: .9rem; color: var(--muted); }
.rg-links a { color: var(--blue); font-weight: 700; text-decoration: none; }
.rg-links a:hover { text-decoration: underline; }
`;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullname: '', contactno: '', email: '', barangay: '', password: '', confirmPassword: '' });
  const [barangays, setBarangays] = useState([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/barangays').then((r) => setBarangays(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;
  const match = form.confirmPassword && form.password === form.confirmPassword;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setBusy(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
      setTimeout(() => navigate('/resident/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Cannot reach the server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rg">
      <style>{css}</style>

      <div className="rg-card">
        <header className="rg-head">
          <img src={logo} alt="Seal of the Municipality of President Carlos P. Garcia" />
          <div>
            <p className="rg-eyebrow">SmartResQ</p>
            <h1>Create your account</h1>
            <p className="rg-sub">President Carlos P. Garcia, Bohol</p>
          </div>
        </header>

        <form className="rg-form" onSubmit={submit}>
          <p className="rg-intro">Register to report emergencies quickly and track their progress.</p>

          <div className="rg-grid">
            <div className="rg-full">
              <label className="rg-label">Full name</label>
              <input className="rg-input" value={form.fullname} onChange={set('fullname')} required autoComplete="name" />
            </div>

            <div>
              <label className="rg-label">Mobile number</label>
              <input className="rg-input" value={form.contactno} onChange={set('contactno')} required inputMode="tel" autoComplete="tel" />
            </div>
            <div>
              <label className="rg-label">Email</label>
              <input className="rg-input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            {barangays.length > 0 && (
              <div className="rg-full">
                <label className="rg-label">Your barangay</label>
                <select className="rg-input" value={form.barangay} onChange={set('barangay')} required>
                  <option value="">Select barangay</option>
                  {barangays.map((b) => <option key={b.id} value={b.id}>{b.barangayname}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="rg-label">Password</label>
              <div className="rg-pw">
                <input className="rg-input" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
                <button type="button" className="rg-eye" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
              </div>
              <div className="rg-hint">At least 8 characters</div>
            </div>
            <div>
              <label className="rg-label">Confirm password</label>
              <input className="rg-input" type={show ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} required autoComplete="new-password" />
              {mismatch && <div className="rg-hint bad">Passwords do not match</div>}
              {match && <div className="rg-hint good">Passwords match</div>}
            </div>
          </div>

          {error && <div className="rg-error" role="alert">{error}</div>}
          {done && <div className="rg-ok" role="status">Account created! Redirecting to login...</div>}

          <button className="rg-btn" disabled={busy || done}>{busy ? 'Creating...' : 'Create account'}</button>

          <div className="rg-links">Already registered? <Link to="/resident/login">Login</Link></div>
        </form>
      </div>
    </div>
  );
}