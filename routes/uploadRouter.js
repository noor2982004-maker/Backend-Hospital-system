
import { Router } from "express";

import {
  showDoctorUploadPage,
  uploadDoctorDocument,
} from "../controllers/dr_upController.js";

import { handleAvatarUpload } from "../middleware/upload.js";

const router = Router();

router.get("/doctor-upload", showDoctorUploadPage);

router.post("/doctor-upload",handleAvatarUpload,uploadDoctorDocument);

export default router;
