const nodemailer = require("nodemailer");

const sendTaskShareEmail = async (email, task, permissions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Task Manager" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "You've Been Added as a Collaborator",
    html: `
        <h1>Task Shared with You</h1>
        <p>The following task has been shared with you:</p>
        <ul>
          <li><strong>Title:</strong> ${task.title}</li>
          <li><strong>Description:</strong> ${task.description}</li>
          <li><strong>Permissions:</strong> ${permissions}</li>
        </ul>
        <p>You can access the task <a href="http://localhost:3000/get-task/${task._id}">here</a>.</p>
      `,
  };

  await transporter.sendMail(mailOptions);
};



module.exports = sendTaskShareEmail;
