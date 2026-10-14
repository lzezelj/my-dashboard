import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Edit from './pages/Edit.tsx';
import Home from './pages/Home.tsx';
import EventManager from './components/EventManager.tsx';
import { deleteAccount, getCurrentUser, logout, type AuthUser } from './services/authentication.api';
import Unauthorized from './pages/Unauthorized.tsx';
import Import from './pages/Import.tsx';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
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

  const showNavbar = user !== null || location.pathname !== '/home';

  return (
    <>
      {showNavbar && (
        <Navbar
          user={user}
          onLogin={setUser}
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
              onLogin={setUser}
              deletionNotice={statusNotice}
              onDismissDeletionNotice={() => setStatusNotice(null)}
            />
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/edit" element={<Edit />}>
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
          <Route path="events" element={<EventManager key="all-events" />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
