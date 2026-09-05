import {Router} from "express";
import { createMovie, createMovieEvent, deleteMovie, getMovie, getMovies, updateMovie , deleteMovieEvent} from "../controllers/movies.controller.js";


const router = Router();

router.get("/", getMovies);
router.get("/:id",getMovie);
router.post("/", createMovie);
router.patch("/:id", updateMovie);
router.delete("/:id", deleteMovie);

router.post("/:id/event",createMovieEvent);
router.delete("/:id/event/:eventId",deleteMovieEvent);

export default router;