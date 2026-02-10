import { Router } from "express";
import { SignUp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", SignUp);

export default router;
