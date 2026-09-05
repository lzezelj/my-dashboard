import {Router} from "express";
import { createAppointment, createAppointmentEvent, deleteAppointment, deleteAppointmentEvent, getAppointment, getAppointments, updateAppointment } from "../controllers/appointments.controller.js";


const router = Router();

router.get("/", getAppointments);
router.get("/:id",getAppointment);
router.post("/", createAppointment);
router.patch("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

router.post("/:id/event",createAppointmentEvent);
router.delete("/:id/event",deleteAppointmentEvent);

export default router;