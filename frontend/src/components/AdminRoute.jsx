// Only shows the page for admins. Everyone else is sent to the start page.
// (The real protection is RLS in the database – this just hides the UI.)
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <p className="center-text">Laddar...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
