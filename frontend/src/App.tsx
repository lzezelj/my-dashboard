import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Edit from './pages/Edit.tsx';
import Home from './pages/Home.tsx';
import EventManager from './components/EventManager.tsx';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
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
