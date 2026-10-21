import { Router } from "express";
import{chatWithAI} from "../controllers/aiController.js"
import axios from 'axios';

const router = Router();

router.post("/chat",chatWithAI);

export default router;