const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function setup() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        const sql = fs.readFileSync('./schema.sql', 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());

        for (let cmd of commands) {
            console.log('Executing SQL part...');
            await conn.query(cmd);
        }

        console.log('Database schema setup complete!');
    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

setup();
