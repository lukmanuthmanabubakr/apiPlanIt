const Task = require("../models/taskModel");
const { Parser } = require("json2csv");
const sendTaskShareEmail = require("../utils/sendTaskShareEmail");

// Create a new task
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    // Check if all fields are provided
    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert dueDate to a Date object and get the current date
    const inputDate = new Date(dueDate);
    const currentDate = new Date();

    // Remove time portion for accurate comparison
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    // Check if the input date is in the past
    if (inputDate < currentDate) {
      return res.status(400).json({
        message: "Please select a valid future date.",
      });
    }

    // Create the task
    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks for the logged-in user
const getTasks = async (req, res) => {
  try {
    const { status, priority, tags, collaborator, sortBy } = req.query;
    const query = { user: req.user.id };

    // Filter based on query parameters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tags) query.tags = { $in: tags.split(",") };
    if (collaborator)
      query["collaborators.email"] = { $regex: collaborator, $options: "i" };

    // Start with the Task model query
    let tasks = Task.find(query);

    // Sorting logic
    if (sortBy) {
      // Dynamically handle the sort by other fields (e.g., dueDate, priority)
      const sortField = sortBy.split(":")[0];
      const sortOrder = sortBy.split(":")[1] === "desc" ? -1 : 1;
      tasks = tasks.sort({ [sortField]: sortOrder });
    } else {
      // Default sorting by createdAt (latest first)
      tasks = tasks.sort({ createdAt: -1 });
    }

    // Execute the query
    tasks = await tasks;
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single task
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Define allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "dueDate",
      "status",
      "priority",
    ];
    const updates = Object.keys(req.body);

    // Check for invalid fields
    const isValidUpdate = updates.every((field) =>
      allowedUpdates.includes(field)
    );
    if (!isValidUpdate) {
      return res.status(400).json({ message: "Invalid fields in update" });
    }

    // Apply updates
    updates.forEach((field) => {
      task[field] = req.body[field];
    });

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a subtask
const addSubtask = async (req, res) => {
  try {
    const { title, status } = req.body; // Extract subtask data from the request body

    // Validate subtask fields
    if (!title) {
      return res.status(400).json({ message: "Subtask title is required" });
    }

    // Find the parent task
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    // Create a subtask object with defaults
    const newSubtask = {
      title,
      status: status || "pending", // Default to "pending" if no status is provided
    };

    // Add the new subtask to the subtasks array
    task.subtasks.push(newSubtask);

    // Save the updated task
    await task.save();

    res.status(201).json({
      message: "Subtask added successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete A subtask 
const deleteSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;

    // Find the parent task
    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    // Find the index of the subtask to be deleted
    const subtaskIndex = task.subtasks.findIndex(
      (subtask) => subtask._id.toString() === subtaskId
    );

    if (subtaskIndex === -1) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Remove the subtask from the array
    task.subtasks.splice(subtaskIndex, 1);

    // Save the updated task
    await task.save();

    res.status(200).json({
      message: "Subtask deleted successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update Subtask
// Update subtask status
const updateSubtaskStatus = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    // Find the subtask
    const subtask = task.subtasks.find(
      (sub) => sub._id.toString() === subtaskId
    );

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Update the status
    subtask.status = status;

    // Save the task
    await task.save();

    res.status(200).json({
      message: "Subtask status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Share a task with others
const shareTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { collaboratorEmail, permissions } = req.body;

    // Find the task
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Authorization check
    if (task.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to share this task" });
    }

    // Check if the collaborator is already added
    if (
      task.collaborators.some((collab) => collab.email === collaboratorEmail)
    ) {
      return res.status(400).json({ message: "Collaborator already added" });
    }

    // Add collaborator
    task.collaborators.push({ email: collaboratorEmail, permissions });
    await task.save();

    // Send email to collaborator
    await sendTaskShareEmail(collaboratorEmail, task, permissions);

    res.status(200).json({ message: "Task shared successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set task recurrence
const setRecurringTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { recurrence } = req.body;

    if (!recurrence) {
      return res.status(400).json({ message: "Recurrence is required" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to set recurrence for this task",
      });
    }

    task.isRecurring = true;
    task.recurrenceInterval = recurrence;
    await task.save();

    res.status(200).json({ message: "Task recurrence set successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export tasks to CSV
const exportTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found to export" });
    }

    const fields = ["title", "description", "status", "priority", "dueDate"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tasks);

    res.header("Content-Type", "text/csv");
    res.attachment("tasks.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getTaskMetrics = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    const total = tasks.length;

    const metrics = {
      total,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
    };

    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const addTag = async (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ message: "Tag is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.tags.push(tag);
    await task.save();

    res.status(200).json({ message: "Tag added successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeTag = async (req, res) => {
  try {
    const { tag } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.tags = task.tags.filter((t) => t !== tag);
    await task.save();

    res.status(200).json({ message: "Tag removed successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addSubtask,
  deleteSubtask,
  updateSubtaskStatus,
  shareTask,
  setRecurringTask,
  exportTasks,
  getTaskMetrics,
  addTag,
  removeTag,
};
