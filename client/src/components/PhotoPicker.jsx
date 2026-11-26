import { useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import Avatar from './Avatar';

const css = `
.pp { display: flex; flex-direction: column; align-items: center; margin: -44px auto 8px; }
.pp-ring { position: relative; width: 96px; height: 96px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 6px 16px rgba(0,0,0,.2), 0 0 0 3px #f5b301; overflow: visible; }
.pp-ring > img, .pp-ring > span { width: 88px !important; height: 88px !important; font-size: 2rem !important; }
.pp-cam { position: absolute; right: -4px; bottom: -2px; width: 30px; height: 30px; display: grid; place-items: center; border: 2px solid #fff; border-radius: 50%;
  background: #0f2557; color: #fff; cursor: pointer; }
.pp-cam:hover { background: #1f3a93; }
.pp-cam:disabled { opacity: .6; cursor: wait; }
.pp-links { display: flex; gap: 14px; margin-top: 10px; }
.pp-links button { border: 0; background: none; padding: 0; font: inherit; font-size: .82rem; font-weight: 700; color: #1f3a93; cursor: pointer; }
.pp-links button.rm { color: #b42318; }
.pp-links button:disabled { opacity: .5; cursor: wait; }
.pp-msg { margin-top: 8px; font-size: .82rem; text-align: center; color: #b42318; }
.pp-msg.ok { color: #067647; }
`;

export default function PhotoPicker() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function pick(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setMsg({ text: 'Only JPG, PNG or WEBP images are allowed' });
    if (file.size > 5 * 1024 * 1024) return setMsg({ text: 'Photo must be 5 MB or smaller' });

    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await api.post('/profile/photo', fd);
      setMsg({ ok: true, text: 'Photo updated' });
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || err.message });
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Remove your profile photo?')) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.delete('/profile/photo');
      window.location.reload();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || err.message });
      setBusy(false);
    }
  }

  return (
    <div className="pp">
      <style>{css}</style>
      <div className="pp-ring">
        <Avatar user={user} size={88} />
        <button type="button" className="pp-cam" disabled={busy} onClick={() => fileRef.current?.click()} aria-label="Change profile photo">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
          </svg>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
      <div className="pp-links">
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>{user.imagename ? 'Change photo' : 'Add photo'}</button>
        {user.imagename && <button type="button" className="rm" disabled={busy} onClick={remove}>Remove</button>}
      </div>
      {msg && <div className={`pp-msg ${msg.ok ? 'ok' : ''}`} role="status">{msg.text}</div>}
    </div>
  );
}