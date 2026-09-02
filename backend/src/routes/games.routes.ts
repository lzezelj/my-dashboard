import {Router} from "express";
import { createGame, deleteGame, getGame, getGames, updateGame } from "../controllers/games.controller.js";


const router = Router();

router.get("/", getGames);
router.get("/:id",getGame);
router.post("/", createGame);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame);

export default router;