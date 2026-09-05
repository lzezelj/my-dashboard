import {Router} from "express";
import { getTvShows, getTvShow, createTvShow, updateTvShow, deleteTvShow, deleteTvShowEvent, createTvShowEvent} from "../controllers/tv_shows.controller.js";


const router = Router();

router.get("/", getTvShows);
router.get("/:id", getTvShow);
router.post("/", createTvShow);
router.patch("/:id", updateTvShow);
router.delete("/:id", deleteTvShow);

router.post("/:id/event",createTvShowEvent);
router.delete("/:id/event",deleteTvShowEvent);

export default router;