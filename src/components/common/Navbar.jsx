import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutRequest } from "../../store/slices/authSlice.js";

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutRequest());
    navigate("/login");
  };

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="wave-mark" aria-hidden="true">
          <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
        </span>
        AI Interview Platform
      </Link>
      {user && (
        <div className="navbar-right">
          <div className="navbar-user">
            <span className="navbar-avatar">{initials}</span>
            <span className="navbar-user-text">
              {user.firstName} {user.lastName}
              <span className="navbar-role">{user.roleType}</span>
            </span>
          </div>
          <button onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </nav>
  );
}
