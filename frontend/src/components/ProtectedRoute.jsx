// Only shows the page if the user is logged in, otherwise sends them to /login.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="center-text">Laddar...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
