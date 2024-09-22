import { body } from "express-validator";
import { users } from "../models/queries.js";

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

function validateSignup() {
    return [
        validateTextInput("username", "username", 8).custom(async (value) => {
            if (await users.getByUsername(value)) {
                throw new Error("Username already exits.");
            }
        }),
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

export { validateSignup };
