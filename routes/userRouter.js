import { Router } from "express";
import {
  updateProfile,
  changePassword,
    getProfile,
    updateAvatar,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { getMyAppointments } from "../controllers/appointmentController.js";
import { handleAvatarUpload } from "../middleware/upload.js";

const router = Router();

router.use(protect); 

router.put("/profile", updateProfile);
router.post("/change-password", changePassword);
router.get("/get-profile", getProfile);
router.get("/appointments", getMyAppointments);
router.put("/avatar", handleAvatarUpload, updateAvatar);

export default router;