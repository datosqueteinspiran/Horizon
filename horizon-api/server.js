import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Helper to handle DB connections
async function query(sql, params) {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(sql, params);
        await conn.end();
        return rows;
    } catch (err) {
        throw err;
    }
}

// Routes
app.get('/', (req, res) => {
    res.send('Horizon API is running correctly.');
});

app.get('/api/full-data', async (req, res) => {
    try {
        const projects = await query('SELECT * FROM projects');
        const objectives = await query('SELECT * FROM objectives ORDER BY `order` ASC');
        const tasks = await query('SELECT * FROM tasks ORDER BY created_at ASC');

        // Nest data
        const data = projects.map(p => ({
            ...p,
            objectives: objectives.filter(o => o.project_id === p.id).map(o => ({
                ...o,
                tasks: tasks.filter(t => t.objective_id === o.id)
            }))
        }));

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const rows = await query('SELECT id, name, username, email, password, initials, color, can_edit, can_view_all FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { id, name, username, email, password, initials, color, can_edit, can_view_all } = req.body;
    try {
        await query(
            'INSERT INTO users (id, name, username, email, password, initials, color, can_edit, can_view_all) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, username, email, password, initials, color, can_edit ? 1 : 0, can_view_all ? 1 : 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, username, email, password, can_edit, can_view_all } = req.body;
    try {
        let sql = 'UPDATE users SET ';
        const params = [];
        const updates = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (username !== undefined) { updates.push('username = ?'); params.push(username); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (password !== undefined) { updates.push('password = ?'); params.push(password); }
        if (can_edit !== undefined) { updates.push('can_edit = ?'); params.push(can_edit ? 1 : 0); }
        if (can_view_all !== undefined) { updates.push('can_view_all = ?'); params.push(can_view_all ? 1 : 0); }

        if (updates.length === 0) return res.json({ success: true });

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(req.params.id);

        await query(sql, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Projects
app.post('/api/projects', async (req, res) => {
    const { id, name } = req.body;
    try {
        await query('INSERT INTO projects (id, name) VALUES (?, ?)', [id, name]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await query('UPDATE projects SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Objectives
app.post('/api/objectives', async (req, res) => {
    const { id, project_id, title } = req.body;
    try {
        await query('INSERT INTO objectives (id, project_id, title) VALUES (?, ?, ?)', [id, project_id, title]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/objectives/:id', async (req, res) => {
    const { title } = req.body;
    try {
        await query('UPDATE objectives SET title = ? WHERE id = ?', [title, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/objectives/:id', async (req, res) => {
    try {
        await query('DELETE FROM objectives WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tasks
app.post('/api/tasks', async (req, res) => {
    const { id, objective_id, content, priority, assigned_to, start_date, end_date } = req.body;
    try {
        await query('INSERT INTO tasks (id, objective_id, content, priority, assigned_to, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, objective_id, content, priority, assigned_to, start_date, end_date]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { content, status, priority, assigned_to, objective_id, start_date, end_date } = req.body;
    try {
        let sql = 'UPDATE tasks SET ';
        const params = [];
        const updates = [];

        if (content !== undefined) { updates.push('content = ?'); params.push(content); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
        if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to); }
        if (objective_id !== undefined) { updates.push('objective_id = ?'); params.push(objective_id); }
        if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
        if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }

        if (updates.length === 0) return res.json({ success: true });

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(req.params.id);

        await query(sql, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create initial data for testing
app.post('/api/setup', async (req, res) => {
    try {
        // This is a simplified setup for the demo/dev
        await query('INSERT IGNORE INTO projects (id, name) VALUES (?, ?)', ['p1', 'Plan de Desarrollo Institucional']);
        await query('INSERT IGNORE INTO objectives (id, project_id, title, `order`) VALUES (?, ?, ?, ?)', ['o1', 'p1', 'Mejorar la infraestructura digital', 0]);
        await query('INSERT IGNORE INTO tasks (id, objective_id, content, status, priority) VALUES (?, ?, ?, ?, ?)', ['t1', 'o1', 'Migración de servidores BPUN', 'To Do', 'Alta']);

        res.json({ message: 'Initial data created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
