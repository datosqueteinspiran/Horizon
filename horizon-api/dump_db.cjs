const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function dumpDB() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [projects] = await conn.execute('SELECT * FROM projects');
        const [objectives] = await conn.execute('SELECT * FROM objectives');
        const [tasks] = await conn.execute('SELECT * FROM tasks');

        const dump = { projects, objectives, tasks };
        fs.writeFileSync('db_dump.json', JSON.stringify(dump, null, 2));
        console.log('Dumped to db_dump.json');
    } catch (err) {
        console.error('Dump error:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

dumpDB();
