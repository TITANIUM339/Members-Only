import { clubs } from "../models/queries.js";
import asyncHandler from "express-async-handler";

const index = {
    get: asyncHandler(async (req, res) => {
        res.render("index", { clubs: await clubs.getAll() });
    }),
};

export { index };
