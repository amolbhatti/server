const express = require("express");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const cookie = require("cookie-parser");
dotenv.config({ path: "./config.env" });
const morgan = require("morgan");
const mongoose = require("mongoose");
const authRoute = require("./Routes/authRoute");
const imageRoute = require("./Routes/imageRoute");
const { task } = require("./utils/schedule");

// enviroment variable setup
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware
app.use(cookie());

app.enable("trust proxy");
// implimenting cors
app.use(cors());
// for pre-flight
app.options("*", cors());

//ROUTES
app.use("/api/v1/user", authRoute);
app.use("/api/v1/image", imageRoute);

app.get("/", task);

//Database connection
const DB = process.env.DB_URL.replace("<password>", process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected"));

module.exports = app;
