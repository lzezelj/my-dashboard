import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Todos from "./pages/Todos.tsx";
import Movies from "./pages/Movies.tsx";

function App() {
  return(
    <>
      <Navbar />
      <Routes>
          <Route path="/" element={<h1>Home</h1>} />
                <Route path="/todos" element={<Todos />} />
                <Route path="/movies" element={<Movies />} />
      </Routes>
    </>

  )
}

export default App;