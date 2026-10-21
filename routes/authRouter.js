import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleLogin,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); 

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/logout", protect, logout);

router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-email", otpLimiter, verifyEmail);
router.post("/reset-password", otpLimiter, resetPassword);

export default router;