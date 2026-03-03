const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [projects] = await conn.execute('SELECT * FROM projects');
        const [user_projects] = await conn.execute('SELECT * FROM user_projects');
        const [users] = await conn.execute('SELECT * FROM users');

        console.log('--- PROJECTS ---');
        console.log(JSON.stringify(projects, null, 2));

        console.log('--- USER_PROJECTS JOIN TABLE ---');
        console.log(JSON.stringify(user_projects, null, 2));

        console.log('--- USERS (relevant fields) ---');
        console.log(JSON.stringify(users.map(u => ({ id: u.id, username: u.username, can_view_all: u.can_view_all })), null, 2));

    } catch (err) {
        console.error('Database check error:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

checkDatabase();
