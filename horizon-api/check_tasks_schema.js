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
        const [rows] = await conn.execute('DESCRIBE tasks');
        console.log('--- TASKS SCHEMA ---');
        console.log(JSON.stringify(rows, null, 2));
        await conn.end();
    } catch (e) {
        console.error(e);
    }
})();
