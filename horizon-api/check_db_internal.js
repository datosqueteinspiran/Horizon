import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

(async () => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [projects] = await conn.execute('SELECT * FROM projects');
        console.log('--- PROJECTS ---');
        console.log(JSON.stringify(projects, null, 2));

        const [tasks] = await conn.execute('SELECT * FROM tasks WHERE content LIKE "%PRIG%"');
        console.log('--- TASKS WITH PRIG ---');
        console.log(JSON.stringify(tasks, null, 2));

        await conn.end();
    } catch (e) {
        console.error(e);
    }
})();
