import { Router } from "express";
import { club, index, newClub, newMessage } from "../controllers/clubs.js";
import { validateClubRoute } from "../helpers/validation.js";
import { matchedData, validationResult } from "express-validator";

const router = Router();

router.get("/", index.get);

router.route("/clubs/new-club").get(newClub.get).post(newClub.post);

router.use("/clubs/:clubTitle", validateClubRoute(), (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        next("router");
        return;
    }

    const { clubTitle } = matchedData(req);

    res.locals.clubTitle = clubTitle;

    next();
});

router.get("/clubs/:clubTitle", club.get);

router.route("/clubs/:clubTitle/new-message").get(newMessage.get);

export default router;
