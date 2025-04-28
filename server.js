const Database = require('better-sqlite3');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// SQLite database
const db = new Database('todos.db', { verbose: console.log });

// todo table
db.prepare(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'low',
    isComplete INTEGER DEFAULT 0,
    isFun INTEGER DEFAULT 0
  )
`).run();

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to include static content
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todo items
app.get('/todos', (req, res) => {
    try {
        const todos = db.prepare('SELECT * FROM todos').all();
        // Convert SQLite integers to booleans
        const formattedTodos = todos.map(todo => ({
            ...todo,
            isComplete: Boolean(todo.isComplete),
            isFun: Boolean(todo.isFun)
        }));
        res.json(formattedTodos);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching todos', error: err.message });
    }
});

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
        if (todo) {
            // Convert SQLite integers to booleans
            const formattedTodo = {
                ...todo,
                isComplete: Boolean(todo.isComplete),
                isFun: Boolean(todo.isFun)
            };
            res.json(formattedTodo);
        } else {
            res.status(404).json({ message: 'Todo item not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching todo', error: err.message });
    }
});

// POST a new todo item
app.post('/todos', (req, res) => {
    const { name, priority = 'low', isFun = false } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const result = db.prepare(`
            INSERT INTO todos (name, priority, isFun) 
            VALUES (?, ?, ?)
        `).run(name, priority, isFun ? 1 : 0);

        const newTodo = {
            id: result.lastInsertRowid,
            name,
            priority,
            isComplete: false,
            isFun
        };

        res.status(201).json(newTodo);
    } catch (err) {
        res.status(500).json({ message: 'Error creating todo', error: err.message });
    }
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
        if (result.changes > 0) {
            res.json({ message: `Todo item ${id} deleted.` });
        } else {
            res.status(404).json({ message: 'Todo item not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error deleting todo', error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Todo API server running at http://localhost:${port}`);
    console.log('Using SQLite database for persistent storage');
});