const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

//dosent work tring this
const sqlite3 = require('sqlite3').verbose();


// SQLite database
const db = new sqlite3.Database('todos.db', (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to SQLite database.');
      db.run(`
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          priority TEXT DEFAULT 'low',
          isComplete INTEGER DEFAULT 0,
          isFun INTEGER DEFAULT 0
        )
      `);
    }
});


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
    db.all('SELECT * FROM todos', [], (err, rows) => {
      if (err) {
        res.status(500).json({ message: 'Error fetching todos', error: err.message });
      } else {
        const todos = rows.map(todo => ({
          ...todo,
          isComplete: Boolean(todo.isComplete),
          isFun: Boolean(todo.isFun)
        }));
        res.json(todos);
      }
    });
  });

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM todos WHERE id = ?', [id], (err, todo) => {
      if (err) {
        res.status(500).json({ message: 'Error fetching todo', error: err.message });
      } else if (todo) {
        res.json({
          ...todo,
          isComplete: Boolean(todo.isComplete),
          isFun: Boolean(todo.isFun)
        });
      } else {
        res.status(404).json({ message: 'Todo item not found' });
      }
    });
  });

// POST a new todo item
app.post('/todos', (req, res) => {
    const { name, priority = 'low', isFun = false } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
  
    db.run('INSERT INTO todos (name, priority, isFun) VALUES (?, ?, ?)', [name, priority, isFun ? 1 : 0], function (err) {
      if (err) {
        res.status(500).json({ message: 'Error creating todo', error: err.message });
      } else {
        res.status(201).json({
          id: this.lastID,
          name,
          priority,
          isComplete: false,
          isFun
        });
      }
    });
  });

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
      if (err) {
        res.status(500).json({ message: 'Error deleting todo', error: err.message });
      } else if (this.changes > 0) {
        res.json({ message: `Todo item ${id} deleted.` });
      } else {
        res.status(404).json({ message: 'Todo item not found' });
      }
    });
  });

// Start the server
app.listen(port, () => {
    console.log(`Todo API server running at http://localhost:${port}`);
  });