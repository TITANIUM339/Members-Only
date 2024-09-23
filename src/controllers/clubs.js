import { matchedData, validationResult } from "express-validator";
import { validateNewClub } from "../helpers/validation.js";
import { clubs } from "../models/queries.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/log-in");
    }
}

const index = {
    get: asyncHandler(async (req, res) => {
        res.render("index", { clubs: await clubs.getAll() });
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
