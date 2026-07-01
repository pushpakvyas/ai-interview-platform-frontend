import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, accessToken } = useSelector((state) => state.auth);

  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.roleType)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
