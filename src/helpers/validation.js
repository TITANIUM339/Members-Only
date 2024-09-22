import { body } from "express-validator";
import { users } from "../models/queries.js";

function validateName(field, name) {
    const fieldName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    return body(field)
        .trim()
        .customSanitizer((value) => value.replaceAll(/\s+/g, " "))
        .notEmpty()
        .withMessage(`Must provide a ${name}.`)
        .isAlpha()
        .withMessage(`${fieldName} must be alphabetical.`)
        .isLength({ max: 8 })
        .withMessage(`${fieldName} must be within 8 characters.`);
}

function validateSignup() {
    return [
        body("username")
            .trim()
            .customSanitizer((value) => value.replaceAll(/\s+/g, " "))
            .notEmpty()
            .withMessage("Must provide a username.")
            .isAlphanumeric()
            .withMessage("Username must be alpha-numeric.")
            .isLength({ max: 8 })
            .withMessage("Username must be within 8 characters.")
            .custom(async (value) => {
                if (await users.getByUsername(value)) {
                    throw new Error("Username already exits.");
                }
            }),
        validateName("firstName", "first name"),
        validateName("lastName", "last name"),
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
