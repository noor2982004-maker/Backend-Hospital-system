import { Router } from "express";
import {
  addInsurance,
  getInsurance,
  updateInsurance,
  deleteInsurance,
} from "../controllers/insuranceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("patient"));

router.post("/", addInsurance);
router.get("/", getInsurance);
router.put("/", updateInsurance);
router.delete("/", deleteInsurance);

export default router;
