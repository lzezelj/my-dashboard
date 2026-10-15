import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Edit from './pages/Edit.tsx';
import Home from './pages/Home.tsx';
import EventManager from './components/EventManager.tsx';
import { deleteAccount, getCurrentUser, logout, type AuthUser } from './services/authentication.api';
import Unauthorized from './pages/Unauthorized.tsx';
import Import from './pages/Import.tsx';
import Welcome from './pages/Welcome.tsx';
import Privacy from './pages/Privacy.tsx';
import Imprint from './pages/Imprint.tsx';
import Footer from './components/Footer.tsx';
import DemoAccounts from './pages/DemoAccounts.tsx';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticationResolved, setIsAuthenticationResolved] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (isActive) setUser(currentUser);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setIsAuthenticationResolved(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setStatusNotice('You have been logged out successfully.');
      navigate('/home', { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setUser(null);
      setStatusNotice('Your account was deleted successfully.');
      navigate('/home', { replace: true });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const isPublicLegalPage = location.pathname === '/privacy' || location.pathname === '/imprint';
  const showNavbar = user !== null || (location.pathname !== '/home' && !isPublicLegalPage);
  const handleLogin = (authenticatedUser: AuthUser, isNewUser: boolean) => {
    setUser(authenticatedUser);
    if (isNewUser) navigate('/welcome', { replace: true });
  };

  if (!isAuthenticationResolved) {
    return (
      <main className="app-loading" role="status" aria-live="polite">
        <div className="app-loading__spinner" aria-hidden="true" />
        <p>Loading Calendar Dashboard…</p>
      </main>
    );
  }

  return (
    <>
      {showNavbar && (
        <Navbar
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      <Routes>
        <Route
          path="/home"
          element={
            <Home
              user={user}
              onLogin={handleLogin}
              deletionNotice={statusNotice}
              onDismissDeletionNotice={() => setStatusNotice(null)}
            />
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/welcome" element={<Welcome user={user} />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route
          path="/demo-accounts"
          element={
            user?.canManageDemoAccounts ? <DemoAccounts /> : <Navigate to="/home" replace />
          }
        />
        <Route path="/edit/*" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<Edit />}>
          <Route index element={<EventManager />} />
          <Route path="import" element={<Import />} />
          <Route path="movies" element={<EventManager key="movie" initialCategory="MOVIE" />} />
          <Route
            path="tv-shows"
            element={<EventManager key="tv-show" initialCategory="TV_SHOW" />}
          />
          <Route path="games" element={<EventManager key="game" initialCategory="GAME" />} />
          <Route
            path="birthdays"
            element={<EventManager key="birthday" initialCategory="BIRTHDAY" />}
          />
          <Route
            path="appointments"
            element={<EventManager key="appointment" initialCategory="APPOINTMENT" />}
          />
          <Route path="todos" element={<EventManager key="todo" initialCategory="TODO" />} />
          <Route path="events" element={<EventManager key="event" initialCategory="EVENT" />} />
          <Route path="travel" element={<EventManager key="travel" initialCategory="TRAVEL" />} />
          <Route path="work" element={<EventManager key="work" initialCategory="WORK" />} />
          <Route path="school" element={<EventManager key="school" initialCategory="SCHOOL" />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
