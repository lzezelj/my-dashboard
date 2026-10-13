import { Link, useLocation } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import type { AuthUser } from '../services/authentication.api';

type NavbarProps = {
  user: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
};

export default function Navbar({ user, onLogin, onLogout }: NavbarProps) {
  const location = useLocation();

  const isEditPage = location.pathname.startsWith('/edit');

  return (
    <nav className="navbar">
      <div className="navbar__links">
        <Link to="/home">Home</Link>
        {!isEditPage && <Link to="/edit">Edit</Link>}
      </div>
      <div className="navbar__auth">
        {user ? (
          <button type="button" onClick={() => void onLogout()}>
            Log out{user.name ? ` (${user.name})` : ''}
          </button>
        ) : (
          <GoogleLoginButton onLogin={onLogin} />
        )}
      </div>
    </nav>
  );
}
