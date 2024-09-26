import pool from "./pool.js";

const users = {
    async getById(id) {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
            id,
        ]);

        return rows[0];
    },
    async getByUsername(username) {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username],
        );

        return rows[0];
    },
    async add(username, firstName, lastName, passwordHash, admin) {
        const { rows } = await pool.query(
            "INSERT INTO users (username, first_name, last_name, password_hash, admin) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [username, firstName, lastName, passwordHash, admin],
        );

        return rows[0].id;
    },
    async isMemberOfClub(userId, clubId) {
        const { rows } = await pool.query(
            "SELECT CASE WHEN COUNT(*) = 1 THEN TRUE ELSE FALSE END AS is_member FROM club_members WHERE user_id = $1 AND club_id = $2",
            [userId, clubId],
        );

        return rows[0].is_member;
    },
};

const clubs = {
    async getById(id) {
        const { rows } = await pool.query("SELECT * FROM clubs WHERE id = $1", [
            id,
        ]);

        return rows[0];
    },
    async getByTitle(title) {
        const { rows } = await pool.query(
            "SELECT * FROM clubs WHERE title = $1",
            [title],
        );

        return rows[0];
    },
    async getAll() {
        const { rows } = await pool.query("SELECT * FROM clubs");

        return rows;
    },

    async add(title, description, password_hash, owner_id) {
        await pool.query(
            "INSERT INTO clubs (title, description, password_hash, owner_id) VALUES ($1, $2, $3, $4)",
            [title, description, password_hash, owner_id],
        );
    },
};

export { users, clubs };
