import { Router } from "express";
import { index, newClub } from "../controllers/clubs.js";

const router = Router();

router.get("/", index.get);

router.route("/clubs/new-club").get(newClub.get);

export default router;
