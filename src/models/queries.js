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
};

const clubs = {
    async getById(id) {
        const { rows } = await pool.query("SELECT * FROM clubs WHERE id = $1", [
            id,
        ]);

        return rows[0];
    },
    async getByName(title) {
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
};

export { users, clubs };
