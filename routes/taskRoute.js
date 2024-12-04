const express = require("express");
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskMetrics,
  removeTag,
  addTag,
  deleteSubtask,
  updateSubtaskStatus,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { addSubtask } = require("../controllers/taskController");
const { shareTask } = require("../controllers/taskController");
const { setRecurringTask } = require("../controllers/taskController");
const { exportTasks } = require("../controllers/taskController");
const router = express.Router();

router.post("/create-task", protect, createTask);
router.get("/get-all-task", protect, getTasks);
router.get("/get-task/:id", protect, getTask);
router.patch("/update-task/:id", protect, updateTask);
router.delete("/delete-task/:id", protect, deleteTask);
router.post("/subtasks/:id", protect, addSubtask);
router.delete("/subtasks/:taskId/:subtaskId", protect, deleteSubtask);
router.put("/:taskId/subtasks/:subtaskId", protect, updateSubtaskStatus); 
router.post("/:id/share", protect, shareTask);
router.post("/:id/recurring", protect, setRecurringTask);
router.get("/export/:id", protect, exportTasks);
router.get('/metrics/:id',protect, getTaskMetrics);
router.post('/:id/add-tags', protect, addTag);
router.delete('/:id/remove-tags',protect, removeTag);


module.exports = router;
