require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const userRoute = require('./routes/userRoute')
const taskRoute = require("./routes/taskRoute");
const errorHandler = require('./middleware/errorMiddleware')

const app = express();

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());


app.use(
  cors({
    origin: ["http://localhost:3000", "https://TrackItNow.vercel.app"],
    credentials: true,
  })
);

// Routes
app.use("/api/users", userRoute);
app.use("/api/tasks", taskRoute);


app.get("/", (req, res) => {
  res.send("Home Page");
});

//Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 7000;

mongoose.connect(process.env.MONGO_DB_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  })
}).catch((err) => console.error(err));
