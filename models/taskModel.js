const mongoose = require("mongoose");
const crypto = require("crypto");

const taskSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a task title"],
    },
    description: {
      type: String,
      required: [true, "Please add a task description"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: [true, "Please add a due date"],
    },
    subtasks: [
      {
        title: String,
        status: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending",
        },
      },
    ],
    collaborators: [
      {
        email: {
          type: String,
          required: true,
        },
        permissions: {
          type: String,
          enum: ["read", "edit"],
          default: "read",
        },
      },
    ],
    tags: [String],
    attachments: [String], //  of file
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
    },
  },

  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
