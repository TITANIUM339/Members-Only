import { body, param } from "express-validator";
import { clubs, messages, users } from "../models/queries.js";
import bcrypt from "bcryptjs";

function validateName(field, name, maxLength) {
    const nameCapital = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    return body(field)
        .trim()
        .notEmpty()
        .withMessage(`Must provide a ${name}.`)
        .isAlpha()
        .withMessage(`${nameCapital} must be alphabetical.`)
        .isLength({ max: maxLength })
        .withMessage(`${nameCapital} must be within ${maxLength} characters.`);
}

function validateTextInput(field, name, maxLength) {
    const nameCapital = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    return body(field)
        .trim()
        .notEmpty()
        .withMessage(`Must provide a ${name}.`)
        .isAlphanumeric()
        .withMessage(`${nameCapital} must be alpha-numeric.`)
        .isLength({ max: maxLength })
        .withMessage(`${nameCapital} must be within ${maxLength} characters.`);
}

function getOneTimeNext(next) {
    let nextCalled = false;

    return (value) => {
        if (!nextCalled) {
            nextCalled = true;
            next(value);
        }
    };
}

function validateSignup() {
    return [
        (req, res, next) => {
            const oneTimeNext = getOneTimeNext(next);

            validateTextInput("username", "username", 8).custom(
                async (value) => {
                    let user;

                    // If the database query fails pass the error to oneTimeNext to prevent a subsequent next call by express-validator and avoid undefined behavior.
                    try {
                        user = await users.getByUsername(value);
                    } catch (error) {
                        oneTimeNext(error);
                        return;
                    }

                    // Validate input normally.
                    if (user) {
                        throw new Error("Username already exists.");
                    }
                },
            )(req, res, oneTimeNext);
        },
        validateName("firstName", "first name", 8),
        validateName("lastName", "last name", 8),
        body("password").notEmpty().withMessage("Must provide a password."),
        body("confirmPassword")
            .notEmpty()
            .withMessage("Must confirm password.")
            .custom((value, { req }) => value === req.body.password)
            .withMessage("Passwords do not match."),
        body("adminPassword")
            .optional({ checkFalsy: true })
            .equals(process.env.ADMIN_PASSWORD)
            .withMessage("Incorrect admin password."),
    ];
}

function validateNewClub() {
    return [
        (req, res, next) => {
            const oneTimeNext = getOneTimeNext(next);

            validateTextInput("title", "title", 16).custom(async (value) => {
                let club;

                try {
                    club = await clubs.getByTitle(value);
                } catch (error) {
                    oneTimeNext(error);
                    return;
                }

                if (club) {
                    throw new Error("Club already exists.");
                }
            })(req, res, oneTimeNext);
        },
        body("description")
            .optional()
            .trim()
            .customSanitizer((value) => value.replaceAll(/\s+/g, " ")),
        body("clubPassword")
            .notEmpty()
            .withMessage("Must provide a club password"),
    ];
}

function validateClubRoute() {
    return (req, res, next) => {
        const oneTimeNext = getOneTimeNext(next);

        param("clubTitle").custom(async (value) => {
            let club;

            try {
                club = await clubs.getByTitle(value);
            } catch (error) {
                oneTimeNext(error);
                return;
            }

            if (!club) {
                throw new Error("Club does not exist.");
            }
        })(req, res, oneTimeNext);
    };
}

function validateNewMessage() {
    return [
        validateTextInput("title", "title", 16),
        body("message")
            .trim()
            .customSanitizer((value) => value.replaceAll(/\s+/g, " "))
            .notEmpty()
            .withMessage("Must provide a message."),
    ];
}

function validateMessageRoute() {
    return (req, res, next) => {
        const oneTimeNext = getOneTimeNext(next);

        param("messageId")
            .isInt({ allow_leading_zeroes: false, min: 1 })
            .bail()
            .toInt()
            .custom(
                async (
                    value,
                    {
                        req: {
                            res: {
                                locals: { clubTitle },
                            },
                        },
                    },
                ) => {
                    let isFromClub = false;

                    try {
                        isFromClub = await messages.isFromClub(
                            value,
                            clubTitle,
                        );
                    } catch (error) {
                        oneTimeNext(error);
                        return;
                    }

                    if (!isFromClub) {
                        throw new Error("Message does not exist.");
                    }
                },
            )(req, res, oneTimeNext);
    };
}

function validateClubJoin() {
    return (req, res, next) => {
        const oneTimeNext = getOneTimeNext(next);

        body("clubPassword")
            .notEmpty()
            .withMessage("Must provide a club password.")
            .bail()
            .custom(
                async (
                    value,
                    {
                        req: {
                            res: {
                                locals: { clubTitle },
                            },
                        },
                    },
                ) => {
                    let match = false;

                    try {
                        const { password_hash } =
                            await clubs.getByTitle(clubTitle);

                        match = await bcrypt.compare(value, password_hash);
                    } catch (error) {
                        oneTimeNext(error);
                        return;
                    }

                    if (!match) {
                        throw new Error("Incorrect club password.");
                    }
                },
            )(req, res, oneTimeNext);
    };
}

function validateLogin() {
    return [
        body("username").notEmpty().withMessage("Must provide a username."),
        body("password").notEmpty().withMessage("Must provide a password."),
    ];
}

export {
    validateSignup,
    validateNewClub,
    validateClubRoute,
    validateNewMessage,
    validateMessageRoute,
    validateClubJoin,
    validateLogin,
};
