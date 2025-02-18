import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { admin } = useAuth();

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute; 