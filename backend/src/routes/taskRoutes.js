const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Task CRUD operations
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/lead/:leadId', taskController.getTasksByLeadId);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.put('/:id/complete', taskController.completeTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
