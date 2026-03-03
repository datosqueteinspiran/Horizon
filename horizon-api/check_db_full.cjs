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
        const [objectives] = await conn.execute('SELECT * FROM objectives');
        const [tasks] = await conn.execute('SELECT * FROM tasks');

        console.log('Projects:', JSON.stringify(projects, null, 2));
        console.log('Objectives count:', objectives.length);
        console.log('Tasks count:', tasks.length);

        if (projects.length > 0) {
            console.log('Objectives for first project:', JSON.stringify(objectives.filter(o => o.project_id === projects[0].id), null, 2));
        }

    } catch (err) {
        console.error('Database check error:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

checkDatabase();
