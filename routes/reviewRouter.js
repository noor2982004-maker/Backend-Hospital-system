import { Router } from "express";
import { getDoctorReviews, addReview } from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:id/reviews", getDoctorReviews);                                  
router.post("/:id/reviews", protect, authorize("patient"), addReview);        

export default router;