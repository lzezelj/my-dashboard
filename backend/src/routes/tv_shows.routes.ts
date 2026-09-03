import {Router} from "express";
import { getTvShows, getTvShow, createTvShow, updateTvShow, deleteTvShow} from "../controllers/tv_shows.controller.js";


const router = Router();

router.get("/", getTvShows);
router.get("/:id", getTvShow);
router.post("/", createTvShow);
router.patch("/:id", updateTvShow);
router.delete("/:id", deleteTvShow);

export default router;