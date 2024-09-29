import { Router } from "express";
import {
    club,
    index,
    newClub,
    newMessage,
} from "../controllers/clubs.js";
import {
    validateClubRoute,
    validateMessageRoute,
} from "../helpers/validation.js";
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

router
    .route("/clubs/:clubTitle/new-message")
    .get(newMessage.get)
    .post(newMessage.post);

router.use(
    "/clubs/:clubTitle/messages/:messageId",
    validateMessageRoute(),
    (req, res, next) => {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            next("router");
            return;
        }

        const { messageId } = matchedData(req);

        res.locals.messageId = messageId;

        next();
    },
);

export default router;
