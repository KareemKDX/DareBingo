// Top bar with app name, admin link (admins only), username and logout.
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Logo from './Logo';

function Navbar() {
  const { profile, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-title">
        <Logo />
      </Link>

      <div className="navbar-right">
        {isAdmin && (
          <Link to="/admin" className="navbar-link">
            Admin
          </Link>
        )}
        {profile && <span className="navbar-user">{profile.username}</span>}
        <button className="button-small" onClick={logout}>
          Logga ut
        </button>
      </div>
    </header>
  );
}

export default Navbar;
