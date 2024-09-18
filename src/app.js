import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import CustomError from "./helpers/customError.js";
import pool from "./models/pool.js";
import { users } from "./models/queries.js";
import bcrypt from "bcryptjs";
import clubsRouter from "./routes/clubs.js";

const PORT = process.env.PORT || 80;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));
app.set("trust proxy", true);

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve("public")));

////////// Authentication //////////
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        store: new (connectPgSimple(session))({
            pool,
            createTableIfMissing: true,
        }),
        resave: false,
        saveUninitialized: false,
    }),
);
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await users.getByUsername(username);

            if (!user) {
                done(null, false, { message: "Incorrect username." });
                return;
            }

            if (!(await bcrypt.compare(password, user.password_hash))) {
                done(null, false, { message: "Incorrect password." });
                return;
            }

            done(null, user);
        } catch (error) {
            done(error);
        }
    }),
);
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await users.getById(id);

        done(null, user);
    } catch (error) {
        done(error);
    }
});
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.year = new Date().getFullYear();
    res.locals.user = req.user || null;
    next();
});

app.use("/", clubsRouter);

////////// Error handling //////////
app.use((req, res, next) =>
    next(new CustomError("Not Found", "It looks like you are lost.", 404)),
);
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.statusCode) {
        res.status(err.statusCode).render("error", { error: err });
    } else {
        const error = new CustomError(
            "Internal Server Error",
            "Oops something went wrong!",
            500,
        );

        res.status(error.statusCode).render("error", { error });
    }
});

app.listen(PORT, () => console.log(`Serving on: http://localhost:${PORT}`));
