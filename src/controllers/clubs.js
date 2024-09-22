import { clubs } from "../models/queries.js";
import asyncHandler from "express-async-handler";

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
        }
    ]
}

export { index, newClub };
