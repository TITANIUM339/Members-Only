import { Router } from "express";
import { signup } from "../controllers/authentication.js";

const router = Router();

router.route("/sign-up").get(signup.get).post(signup.post);

export default router;
