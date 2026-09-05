import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Todos from "./pages/Todos.tsx";
import Movies from "./pages/Movies.tsx";
import TvShows from "./pages/TvShows.tsx";
import Games from "./pages/Games.tsx";
import Birthdays from "./pages/Birthdays.tsx";
import Edit from "./pages/Edit.tsx";
import Appointments from "./pages/Appointments.tsx";

function App() {
  return(
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/edit" element={<Edit />}>
          <Route index element={<h1></h1>} />
          <Route path="movies" element={<Movies />} />
          <Route path="tv-shows" element={<TvShows />} />
          <Route path="games" element={<Games />} />
          <Route path="birthdays" element={<Birthdays />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="todos" element={<Todos />} />
      </Route>
    </Routes>
    </>

  )
}

export default App;