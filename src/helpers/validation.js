import { body, param } from "express-validator";
import { clubs, users } from "../models/queries.js";

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

export { validateSignup, validateNewClub, validateClubRoute };
