import {Router} from "express";
import { createBirthday, deleteBirthday, getBirthday, getBirthdays, updateBirthday, createBirthdayEvent,deleteBirthdayEvent } from "../controllers/birthday.controller.js";


const router = Router();

router.get("/", getBirthdays);
router.get("/:id", getBirthday);
router.post("/", createBirthday);
router.patch("/:id", updateBirthday);
router.delete("/:id", deleteBirthday);

router.post("/:id/event",createBirthdayEvent);
router.delete("/:id/event/:eventId",deleteBirthdayEvent);

export default router;