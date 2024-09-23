import { matchedData, validationResult } from "express-validator";
import { validateNewClub } from "../helpers/validation.js";
import { clubs, users } from "../models/queries.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/log-in");
    }
}

async function isUserClubActionAllowed(user, club, action) {
    if (!user) {
        return;
    }

    switch (action) {
        case "delete":
            return user.admin || user.id === club.owner_id;

        case "join":
            return !user.admin && user.id !== club.owner_id;

        case "leave":
            return await users.isMemberOfClub(user.id, club.id);
    }
}

const index = {
    get: asyncHandler(async (req, res) => {
        res.render("index", {
            clubs: await Promise.all(
                (await clubs.getAll()).map(async (club) => {
                    // Shows the button if the user is allowed to perform the action associated with that button.
                    const [del, join, leave] = await Promise.all([
                        isUserClubActionAllowed(req.user, club, "delete"),
                        isUserClubActionAllowed(req.user, club, "join"),
                        isUserClubActionAllowed(req.user, club, "leave"),
                    ]);

                    club.delete = del;
                    club.join = join;
                    club.leave = leave;

                    return club;
                }),
            ),
        });
    }),
};

const newClub = {
    get: [
        isAuthenticated,
        (req, res) => {
            res.render("newClub");
        },
    ],
    post: [
        isAuthenticated,
        validateNewClub(),
        asyncHandler(async (req, res) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                res.status(400).render("newClub", {
                    errors: error.array().map((error) => error.msg),
                    title: req.body.title,
                    description: req.body.description,
                });
                return;
            }

            const { title, description, clubPassword } = matchedData(req);

            const passwordHash = await bcrypt.hash(clubPassword, 10);

            await clubs.add(title, description, passwordHash, req.user.id);

            res.redirect("/");
        }),
    ],
};

export { index, newClub };
