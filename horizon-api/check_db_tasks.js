import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/SoftIA/Pendientes/horizon-api/.env' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

(async () => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute('SELECT id, content, start_date, end_date FROM tasks LIMIT 10');
        console.log('--- TASKS IN DB ---');
        console.log(JSON.stringify(rows, null, 2));
        await conn.end();
    } catch (e) {
        console.error(e);
    }
})();
