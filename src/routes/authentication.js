import { Router } from "express";
import { signup, login, logout } from "../controllers/authentication.js";

const router = Router();

router.route("/sign-up").get(signup.get).post(signup.post);

router.route("/log-in").get(login.get);

router.post("/log-out", logout.post);

export default router;
