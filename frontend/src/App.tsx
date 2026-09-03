import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Todos from "./pages/Todos.tsx";
import Movies from "./pages/Movies.tsx";
import TvShows from "./pages/TvShows.tsx";
import Games from "./pages/Games.tsx";
import Birthdays from "./pages/Birthdays.tsx";

function App() {
  return(
    <>
      <Navbar />
      <Routes>
          <Route path="/" element={<h1>Home</h1>} />
                <Route path="/todos" element={<Todos />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/calendar-events" element={<h1>Calendar Events</h1>} />
                <Route path="/birthdays" element={<Birthdays />} />
                <Route path="/games" element={<Games />} />
                <Route path="/tv-shows" element={<TvShows />} />
      </Routes>
    </>

  )
}

export default App;