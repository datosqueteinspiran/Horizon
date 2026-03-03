const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function migrate() {
    let conn;
    try {
        const data = JSON.parse(fs.readFileSync('./migration_data.json', 'utf8'));
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Starting migration with mysql2...');

        // 1. Users
        for (const user of data.horizon_users) {
            console.log(`Migrating user: ${user.name}`);
            await conn.query(
                'INSERT IGNORE INTO users (id, name, email, username, password, initials, color, can_edit, can_view_all) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [user.id, user.name, user.email, user.username, user.password, user.initials, user.color, user.canEdit ? 1 : 0, user.canViewAll ? 1 : 0]
            );
        }

        // 2. Projects
        for (const project of data.horizon_data) {
            console.log(`Migrating project: ${project.name}`);
            await conn.query('INSERT IGNORE INTO projects (id, name) VALUES (?, ?)', [project.id, project.name]);

            // 3. Objectives
            for (const objective of project.objectives) {
                let objId = objective.id;
                if (objId === 'unassigned') objId = `unassigned-${project.id}`;

                console.log(`  Migrating objective: ${objective.title}`);
                await conn.query(
                    'INSERT IGNORE INTO objectives (id, project_id, title) VALUES (?, ?, ?)',
                    [objId, project.id, objective.title]
                );

                // 4. Tasks
                if (objective.tasks) {
                    for (const task of objective.tasks) {
                        console.log(`    Migrating task: ${task.content}`);
                        await conn.query(
                            'INSERT IGNORE INTO tasks (id, objective_id, content, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
                            [task.id, objId, task.content, task.status, task.priority, task.assignedTo]
                        );
                    }
                }
            }
        }

        console.log('Migration with mysql2 finished successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

migrate();
