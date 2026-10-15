import { Link } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import type { AuthUser } from '../services/authentication.api';
import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { exportEvents } from '../services/events.api';

type NavbarProps = {
  user: AuthUser | null;
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
};

export default function Navbar({ user, onLogin, onLogout, onDeleteAccount }: NavbarProps) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', closeWhenOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  const downloadCalendar = async () => {
    try {
      const calendar = await exportEvents();
      const blob = new Blob([JSON.stringify(calendar, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'personal-dashboard-calendar.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setAccountError('Your calendar could not be downloaded. Please try again before deleting your account.');
    }
  };

  const confirmAccountDeletion = async () => {
    setAccountError(null);
    setIsDeletingAccount(true);
    try {
      await onDeleteAccount();
      setShowDeleteAccountConfirmation(false);
    } catch {
      setAccountError('Your account could not be deleted. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

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
      <Modal
        isOpen={showDeleteAccountConfirmation}
        title="Delete your account?"
        confirmLabel={isDeletingAccount ? 'Deleting…' : 'Delete account'}
        onCancel={() => {
          if (!isDeletingAccount) {
            setShowDeleteAccountConfirmation(false);
            setAccountError(null);
          }
        }}
        onConfirm={() => void confirmAccountDeletion()}
        destructive
      >
        <p>This permanently deletes your account and all calendar events. This cannot be undone.</p>
        <button type="button" className="account-export-button" onClick={() => void downloadCalendar()}>
          Download calendar JSON first
        </button>
        {accountError && <p className="form-error">{accountError}</p>}
      </Modal>
      <div className="navbar__links">
        <Link to="/home">Home</Link>
      </div>
      <div className="navbar__auth">
        {user ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="account-menu__trigger"
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              My Account
            </button>
            {isAccountMenuOpen && (
              <div className="account-menu__items" role="menu">
                <Link to="/events" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
                  Events
                </Link>
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  setShowLogoutConfirmation(true);
                }}
              >
                Log out
              </button>
              <button
                type="button"
                className="navbar__delete-account"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  setShowDeleteAccountConfirmation(true);
                }}
              >
                Delete account
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
