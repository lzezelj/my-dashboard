import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Edit from './pages/Edit.tsx';
import Home from './pages/Home.tsx';
import EventManager from './components/EventManager.tsx';
import { getCurrentUser, logout, type AuthUser } from './services/authentication.api';
import Unauthorized from './pages/Unauthorized.tsx';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  const showNavbar = user !== null || location.pathname !== '/home';

  return (
    <>
      {showNavbar && <Navbar user={user} onLogin={setUser} onLogout={handleLogout} />}
      <Routes>
        <Route path="/home" element={<Home user={user} onLogin={setUser} />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/edit" element={<Edit />}>
          <Route index element={<h1></h1>} />
          <Route path="movies" element={<EventManager key="movie" category="MOVIE" />} />
          <Route path="tv-shows" element={<EventManager key="tv-show" category="TV_SHOW" />} />
          <Route path="games" element={<EventManager key="game" category="GAME" />} />
          <Route path="birthdays" element={<EventManager key="birthday" category="BIRTHDAY" />} />
          <Route
            path="appointments"
            element={<EventManager key="appointment" category="APPOINTMENT" />}
          />
          <Route path="todos" element={<EventManager key="todo" category="TODO" />} />
          <Route path="events" element={<EventManager key="all-events" />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
