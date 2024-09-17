import { Router } from "express";
import controller from "../controllers/clubs.js";

const router = Router();

router.get("/", controller.getClubs);

export default router;
