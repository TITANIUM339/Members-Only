import { Router } from "express";
import { signup, logout } from "../controllers/authentication.js";

const router = Router();

router.route("/sign-up").get(signup.get).post(signup.post);

router.post("/log-out", logout.post);

export default router;
