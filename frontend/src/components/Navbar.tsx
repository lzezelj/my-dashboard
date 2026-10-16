import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import Modal from './Modal';
import type { AuthUser } from '../services/authentication.api';

type NavbarProps = {
  user: AuthUser | null;
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
  onLogout: () => Promise<void>;
};

export default function Navbar({ user, onLogin, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const linkClass = (active: boolean) => (active ? 'navbar__link--active' : undefined);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return (
    <nav className="navbar">
      <Modal
        isOpen={confirmLogout}
        title="Log out?"
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void onLogout();
        }}
      >
        <p>You will need to sign in again to access your events.</p>
      </Modal>
      <div className="navbar__links">
        <Link
          className={linkClass(pathname === '/home')}
          aria-current={pathname === '/home' ? 'page' : undefined}
          to="/home"
        >
          Home
        </Link>
        {user && (
          <>
            <Link
              className={linkClass(pathname.startsWith('/events') && pathname !== '/events/add')}
              aria-current={
                pathname.startsWith('/events') && pathname !== '/events/add' ? 'page' : undefined
              }
              to="/events"
            >
              Manage events
            </Link>
            <Link
              className={linkClass(pathname === '/events/add')}
              aria-current={pathname === '/events/add' ? 'page' : undefined}
              to="/events/add"
            >
              Add event
            </Link>
          </>
        )}
      </div>
      <div className="navbar__auth">
        {user ? (
          <div className="account-menu" ref={menuRef}>
            <button
              className={`account-menu__trigger${pathname === '/account' ? ' navbar__link--active' : ''}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              My Account
            </button>
            {open && (
              <div className="account-menu__items" role="menu">
                <Link to="/account" role="menuitem" onClick={() => setOpen(false)}>
                  Overview
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setConfirmLogout(true);
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <GoogleLoginButton onLogin={onLogin} />
        )}
      </div>
    </nav>
  );
}
