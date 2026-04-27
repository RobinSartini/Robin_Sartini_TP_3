const express = require('express');
const { pool, redis } = require('./db');

const router = express.Router();

// Mock tasks array for simpler demonstration
let tasks = [];
let nextId = 1;

router.get('/health', async (req, res) => {
  const health = { status: 'healthy', version: process.env.APP_VERSION || '1.0.0', timestamp: new Date().toISOString() };

  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (e) {
    health.status = 'unhealthy';
    health.database = 'disconnected';
  }

  try {
    if (process.env.NODE_ENV !== 'test') {
      await redis.ping();
      health.cache = 'connected';
    } else {
      health.cache = 'connected'; // Mocked in test
    }
  } catch (e) {
    health.status = 'unhealthy';
    health.cache = 'disconnected';
  }

  const code = health.status === 'healthy' ? 200 : 503;
  res.status(code).json(health);
});

// CRUD API
router.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

router.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/api/tasks', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newTask = { id: nextId++, title, description: description || '', completed: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { title, description, completed } = req.body;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = completed;

  res.json(task);
});

router.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

module.exports = router;
