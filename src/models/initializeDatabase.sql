CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(8) NOT NULL UNIQUE,
    first_name VARCHAR(8) NOT NULL,
    last_name VARCHAR(8) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(16) NOT NULL UNIQUE,
    description TEXT,
    password_hash VARCHAR(128) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    location VARCHAR(32),
    user_id INTEGER NOT NULL REFERENCES users,
    club_id INTEGER NOT NULL REFERENCES clubs
);

CREATE TABLE IF NOT EXISTS club_members (
    club_id INTEGER NOT NULL REFERENCES clubs,
    user_id INTEGER NOT NULL REFERENCES users
);
