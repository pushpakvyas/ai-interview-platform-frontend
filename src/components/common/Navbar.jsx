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

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">AI Interview Platform</Link>
      {user && (
        <div className="navbar-right">
          <span>{user.firstName} {user.lastName} · <span style={{color:"var(--indigo)"}}>{user.roleType}</span></span>
          <button onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </nav>
  );
}
