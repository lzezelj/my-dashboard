import {Router} from "express";
import { getCalendarEvent, getCalendarEvents, getSourceEvents } from "../controllers/events.controller.js";


const router = Router();

router.get("/", getCalendarEvents);
router.get("/:type/:sourceId",getCalendarEvent);
router.get("/source", getSourceEvents);

export default router;