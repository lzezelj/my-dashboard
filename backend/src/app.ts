import express from "express";
import todoRoutes from "./routes/todo.routes.js";
import movieRoutes from "./routes/movies.routes.js";
import eventRoutes from "./routes/events.routes.js";
import birthdayRoutes from "./routes/birthday.routes.js";
import gameRoutes from "./routes/games.routes.js";
import tvShowRoutes from "./routes/tv_shows.routes.js";
import appointmentRoutes from "./routes/appointments.routes.js";
import cors from "cors";

const app=express();
const PORT =3000;

app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());
app.use("/api/todos", todoRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/tvShows", tvShowRoutes);
app.use("/api/appointments",appointmentRoutes);
app.use("/api/events", eventRoutes);
app.get("/api/health",(_req,res)=>{
    res.json({
        status:"ok",
        message:"Backend is running"
    });
});

app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})