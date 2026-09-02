import express from "express";
import todoRoutes from "./routes/todo.routes.js";

const app=express();
const PORT =3000;

app.use(express.json());
app.use("/api/todos", todoRoutes);
app.get("/api/health",(_req,res)=>{
    res.json({
        status:"ok",
        message:"Backend is running"
    });
});

app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})