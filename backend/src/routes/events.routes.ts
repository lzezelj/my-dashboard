import {Router} from "express";
import { getCalendarEvent, getCalendarEvents, getSourceEvent } from "../controllers/events.controller.js";


const router = Router();

router.get("/", getCalendarEvents);
router.get("/:type/:sourceId",getCalendarEvent);
router.get("/:id/:type/:sourceId", getSourceEvent);

export default router;