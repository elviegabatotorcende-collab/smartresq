import { Navigate } from 'react-router-dom';
import { useAuth, homePath } from '../AuthContext';

export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!user) return <Navigate to={roles.includes(1) ? '/resident/login' : '/staff/login'} replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  return children;
}