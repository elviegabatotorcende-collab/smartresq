import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { onNotification } from '../live';

export default function NotificationBell({ to }) {
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const refresh = () =>
      api.get('/notifications/unread-count').then((r) => setUnread(r.data.unread)).catch(() => {});
    refresh();
    window.addEventListener('notifications:changed', refresh);
    const off = onNotification((n) => {
      setToast(n);
      refresh();
    });
    return () => {
      window.removeEventListener('notifications:changed', refresh);
      off();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <Link to={to} className="bell" aria-label="Notifications">
        🔔{unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
      </Link>
      {toast && (
        <Link to={to} className="toast" onClick={() => setToast(null)}>
          {toast.message}
        </Link>
      )}
    </>
  );
}