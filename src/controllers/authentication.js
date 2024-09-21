import { validateSignup } from "../helpers/validation.js";
import { validationResult, matchedData } from "express-validator";
import asyncHandler from "express-async-handler";
import { users } from "../models/queries.js";
import bcrypt from "bcryptjs";

const signup = {
    get(req, res) {
        res.render("signup");
    },
    post: [
        validateSignup(),
        asyncHandler(async (req, res, next) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                res.status(400).render("signup", { errors: error.array() });
                return;
            }

            const { username, firstName, lastName, password, adminPassword } =
                matchedData(req);

            const admin = adminPassword ? true : false;

            const passwordHash = await bcrypt.hash(password, 10);

            const id = await users.add(
                username,
                firstName,
                lastName,
                passwordHash,
                admin,
            );

            const user = {
                id,
                first_name: firstName,
                last_name: lastName,
                admin,
            };

            req.login(user, (err) => {
                if (err) {
                    next(err);
                    return;
                }

                res.redirect("/");
            });
        }),
    ],
};

const logout = {
    post(req, res, next) {
        req.logout((err) => {
            if (err) {
                next(err);
                return;
            }

            res.redirect("/");
        });
    },
};

export { signup, logout };
