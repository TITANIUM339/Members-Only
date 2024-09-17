import { clubs } from "../models/queries.js";
import asyncHandler from "express-async-handler";

export default {
    getClubs: asyncHandler(async (req, res) => {
        res.render("index", { clubs: await clubs.getAll() });
    }),
};
