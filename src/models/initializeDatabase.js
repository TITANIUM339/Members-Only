import pg from "pg";
import path from "path";
import { readFile } from "fs/promises";

const client = new pg.Client({ connectionString: process.argv[2] });

(async () => {
    console.log("Initializing...");

    const SQL = await readFile(
        path.join(import.meta.dirname, "initializeDatabase.sql"),
        { encoding: "utf-8" },
    );

    await client.connect();
    await client.query(SQL);
    await client.end();

    console.log("Done!");
})().catch((error) => console.error(error));
