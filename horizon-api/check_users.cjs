const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await conn.execute('SELECT * FROM users');
        console.log('Users in database:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

checkUsers();
