import {Router} from "express";
import { createBirthday, deleteBirthday, getBirthday, getBirthdays, updateBirthday } from "../controllers/birthday.controller.js";


const router = Router();

router.get("/", getBirthdays);
router.get("/:id", getBirthday);
router.post("/", createBirthday);
router.put("/:id", updateBirthday);
router.delete("/:id", deleteBirthday);

export default router;