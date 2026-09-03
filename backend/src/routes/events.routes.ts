import {Router} from "express";
import { updateEvent, createEvent, deleteEvent, getEvents, getEvent } from "../controllers/events.controller.js";


const router = Router();

router.get("/", getEvents);
router.get("/:id",getEvent);
router.post("/", createEvent);
router.patch("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;