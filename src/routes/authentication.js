import { Router } from "express";
import { signup } from "../controllers/authentication.js"

const router = Router();

router.route("/sign-up").get(signup.get);

export default router;
