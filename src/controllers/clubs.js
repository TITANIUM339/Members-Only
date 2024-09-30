import { matchedData, validationResult } from "express-validator";
import { validateNewClub, validateNewMessage } from "../helpers/validation.js";
import { clubs, messages, users } from "../models/queries.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import CustomError from "../helpers/customError.js";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/log-in");
    }
}

async function isUserClubActionAllowed(user, club, action) {
    if (!user) {
        return;
    }

    switch (action) {
        case "delete":
            return user.admin || user.id === club.owner_id;

        case "join":
            return (
                !user.admin &&
                user.id !== club.owner_id &&
                !(await users.isMemberOfClub(user.id, club.id))
            );

        case "leave":
            return await users.isMemberOfClub(user.id, club.id);
    }
}

async function isUserClubAccessAllowed(user, club) {
    if (!user) {
        return;
    }

    return (
        user.admin ||
        user.id === club.owner_id ||
        (await users.isMemberOfClub(user.id, club.id))
    );
}

function isUserMessageDeleteAllowed(user, message, club) {
    if (!user) {
        return;
    }

    return (
        user.admin || user.id === club.owner_id || user.id === message.user_id
    );
}

const forbiddenError = new CustomError(
    "Forbidden",
    "What do you think you are doing?",
    403,
);

const checkClubAccess = asyncHandler(async (req, res, next) => {
    if (
        !(await isUserClubAccessAllowed(
            req.user,
            await clubs.getByTitle(res.locals.clubTitle),
        ))
    ) {
        throw forbiddenError;
    }

    next();
});

const checkMessageDeleteAccess = asyncHandler(async (req, res, next) => {
    if (
        !isUserMessageDeleteAllowed(
            req.user,
            await messages.getById(res.locals.messageId),
            await clubs.getByTitle(res.locals.clubTitle),
        )
    ) {
        throw forbiddenError;
    }

    next();
});

function checkClubActionAccess(action) {
    return asyncHandler(async (req, res, next) => {
        if (
            !(await isUserClubActionAllowed(
                req.user,
                await clubs.getByTitle(res.locals.clubTitle),
                action,
            ))
        ) {
            throw forbiddenError;
        }

        next();
    });
}

const index = {
    get: asyncHandler(async (req, res) => {
        res.render("index", {
            clubs: await Promise.all(
                (await clubs.getAll()).map(async (club) => {
                    // Shows the button if the user is allowed to perform the action associated with that button.
                    const [del, join, leave] = await Promise.all([
                        isUserClubActionAllowed(req.user, club, "delete"),
                        isUserClubActionAllowed(req.user, club, "join"),
                        isUserClubActionAllowed(req.user, club, "leave"),
                    ]);

                    club.delete = del;
                    club.join = join;
                    club.leave = leave;

                    return club;
                }),
            ),
        });
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

const club = {
    get: asyncHandler(async (req, res) => {
        const club = await clubs.getByTitle(res.locals.clubTitle);

        res.render("messages", {
            hasClubAccess: await isUserClubAccessAllowed(req.user, club),
            messages: await Promise.all(
                (await messages.getByClubTitle(res.locals.clubTitle)).map(
                    async (message) => {
                        message.delete = isUserMessageDeleteAllowed(
                            req.user,
                            message,
                            club,
                        );

                        const { first_name, last_name } = await users.getById(
                            message.user_id,
                        );

                        message.date = format(
                            message.date,
                            "yyy-MM-dd HH:mm 'UTC'",
                        );
                        message.firstName = first_name;
                        message.lastName = last_name;

                        return message;
                    },
                ),
            ),
        });
    }),
};

const newMessage = {
    get: [
        isAuthenticated,
        checkClubAccess,
        (req, res) => {
            res.render("newMessage");
        },
    ],
    post: [
        isAuthenticated,
        checkClubAccess,
        validateNewMessage(),
        asyncHandler(async (req, res) => {
            const error = validationResult(req);

            if (!error.isEmpty()) {
                res.status(400).render("newMessage", {
                    errors: error.array().map((error) => error.msg),
                    title: req.body.title,
                    message: req.body.message,
                });
                return;
            }

            const { country, city } = await (
                await fetch(
                    `http://ip-api.com/json/${req.ip}?fields=country,city`,
                )
            ).json();

            const location =
                country || city
                    ? `${country || ""} ${city || ""}`.trimEnd()
                    : "Unknown";

            const { id: clubId } = await clubs.getByTitle(res.locals.clubTitle);

            const { title, message } = matchedData(req);

            await messages.add(
                title,
                message,
                new UTCDate(),
                location,
                req.user.id,
                clubId,
            );

            res.redirect(`/clubs/${res.locals.clubTitle}`);
        }),
    ],
};

const deleteMessage = {
    post: [
        isAuthenticated,
        checkMessageDeleteAccess,
        asyncHandler(async (req, res) => {
            await messages.delete(res.locals.messageId);

            res.redirect(`/clubs/${res.locals.clubTitle}`);
        }),
    ],
};

const deleteClub = {
    post: [
        isAuthenticated,
        checkClubActionAccess("delete"),
        asyncHandler(async (req, res) => {
            await clubs.delete(res.locals.clubTitle);

            res.redirect("/");
        }),
    ],
};

const joinClub = {
    get: [
        isAuthenticated,
        checkClubActionAccess("join"),
        (req, res) => {
            res.render("joinClub");
        },
    ],
};

export {
    index,
    newClub,
    club,
    newMessage,
    deleteMessage,
    deleteClub,
    joinClub,
};
