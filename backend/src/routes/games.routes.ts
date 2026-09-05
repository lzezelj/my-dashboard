import {Router} from "express";
import { createGame, deleteGame, getGame, getGames, updateGame, createGameEvent, deleteGameEvent } from "../controllers/games.controller.js";


const router = Router();

router.get("/", getGames);
router.get("/:id",getGame);
router.post("/", createGame);
router.patch("/:id", updateGame);
router.delete("/:id", deleteGame);

router.post("/:id/event",createGameEvent);
router.delete("/:id/event/:eventId",deleteGameEvent);

export default router;