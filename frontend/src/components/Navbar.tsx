import { Link, useLocation } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import type { AuthUser } from '../services/authentication.api';
import { useState } from 'react';
import Modal from './Modal';

type NavbarProps = {
  user: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
};

export default function Navbar({ user, onLogin, onLogout }: NavbarProps) {
  const location = useLocation();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const isEditPage = location.pathname.startsWith('/edit');

  return (
    <nav className="navbar">
      <Modal
        isOpen={showLogoutConfirmation}
        title="Log out?"
        confirmLabel="Log out"
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={() => {
          setShowLogoutConfirmation(false);
          void onLogout();
        }}
      >
        <p>You will need to sign in with Google again to access your events.</p>
      </Modal>
      <div className="navbar__links">
        <Link to="/home">Home</Link>
        {!isEditPage && <Link to="/edit">Edit</Link>}
      </div>
      <div className="navbar__auth">
        {user ? (
          <button type="button" onClick={() => setShowLogoutConfirmation(true)}>
            Log out{user.name ? ` (${user.name})` : ''}
          </button>
        ) : (
          <GoogleLoginButton onLogin={onLogin} />
        )}
      </div>
    </nav>
  );
}
