import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
import { connectLive, disconnectLive } from './live';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const homePath = (user) => (user.role === 1 ? '/resident/home' : '/staff/dashboard');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // open the live connection while someone is logged in, close it on logout
  const userId = user?.id;
  useEffect(() => {
    if (userId) connectLive(localStorage.getItem('token'));
    else disconnectLive();
  }, [userId]);

  async function login(identifier, password, portal) {
    const { data } = await api.post('/auth/login', { identifier, password, portal });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}