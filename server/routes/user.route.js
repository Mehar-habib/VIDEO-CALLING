import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller.js";

const router = Router();

router.get("/", getAllUsers);
// router.get("/search", )
// router.get("/:id", )

export default router;
