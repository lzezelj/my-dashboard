import {Router} from "express";
import { updateEvent, createEvent, deleteEvent, getEvents, getEvent } from "../controllers/calendar_events.controller.js";


const router = Router();

router.get("/", getEvents);
router.get("/:id",getEvent);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;