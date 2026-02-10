import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import isLogin from "../middlewares/isLogin.js";

const router = Router();

router.get("/", isLogin, getAllUsers);
// router.get("/search", )
// router.get("/:id", )

export default router;
