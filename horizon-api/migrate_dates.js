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
        console.log('Adding start_date and end_date columns to tasks table...');
        await conn.execute('ALTER TABLE tasks ADD COLUMN start_date DATE NULL AFTER assigned_to');
        await conn.execute('ALTER TABLE tasks ADD COLUMN end_date DATE NULL AFTER start_date');
        console.log('Columns added successfully.');
        await conn.end();
    } catch (e) {
        console.error('Error updating database:', e);
    }
})();
