import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import {getacceptedDoctors,getDoctorById,getDoctoravailability
} from "../controllers/doctorController.js";
import{getSpecialitiesPatients} from"../controllers/specialtyController.js";

const router = Router();

//for patient:

router.get("/patientviewspec",getSpecialitiesPatients)
router.get("/filterdoctor",getacceptedDoctors)//all,governorate,today?,specialty
router.get("/viewdoctor/:id",getDoctorById)
router.get("/viewdoctordays/:id",getDoctoravailability)


// router.get("/reviews/:id", getDoctorReviews);


export default router;