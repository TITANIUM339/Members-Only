import { validateSignup } from "../helpers/validation.js";
import { validationResult, matchedData } from "express-validator";
import asyncHandler from "express-async-handler";
import { users } from "../models/queries.js";
import bcrypt from "bcryptjs";
import passport from "passport";

const signup = {
    get(req, res) {
        res.render("signup");
    },
    post: [
        validateSignup(),
        asyncHandler(async (req, res, next) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                res.status(400).render("signup", {
                    errors: error.array().map((error) => error.msg),
                    username: req.body.username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                });
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

const login = {
    get(req, res) {
        res.render("login");
    },
    post(req, res, next) {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                next(err);
                return;
            }

            if (!user) {
                res.status(401).render("login", {
                    errors: [info.message],
                    username: req.body.username,
                });
                return;
            }

            req.login(user, (err) => {
                if (err) {
                    next(err);
                    return;
                }

                res.redirect("/");
            });
        })(req);
    },
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

export { signup, login, logout };
