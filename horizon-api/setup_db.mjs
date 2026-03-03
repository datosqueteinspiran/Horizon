import mariadb from 'mariadb';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 1
});

async function setup() {
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = fs.readFileSync('./schema.sql', 'utf8');

        // Execute SQL commands one by one
        const commands = sql.split(';').filter(cmd => cmd.trim());
        for (let cmd of commands) {
            console.log('Executing:', cmd.substring(0, 50) + '...');
            await conn.query(cmd);
        }

        console.log('Database schema setup complete!');
    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        if (conn) conn.end();
        process.exit();
    }
}

setup();
