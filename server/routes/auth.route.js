import { Router } from "express";
import { Login, Logout, SignUp } from "../controllers/auth.controller.js";
import isLogin from "../middlewares/isLogin.js";

const router = Router();

router.post("/signup", SignUp);
router.post("/login", Login);
router.post("/logout", isLogin, Logout);

export default router;
