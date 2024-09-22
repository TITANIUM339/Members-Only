import { Router } from "express";
import { index } from "../controllers/clubs.js";

const router = Router();

router.get("/", index.get);

export default router;
