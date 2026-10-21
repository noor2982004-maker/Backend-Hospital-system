import { Router } from "express";
import { getacceptedDoctors, getDoctorById } from "../controllers/doctorController.js";

const router = Router();

router.get("/", getacceptedDoctors);
router.get("/:id", getDoctorById);

export default router;