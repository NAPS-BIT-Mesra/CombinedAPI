const express = require("express");
const cors = require("cors");
const userRouter = require("./Routes/UserRoute");
const imageRoute = require("./Routes/imageRoute"); 
const blogRoute = require("./Routes/blogRoute")
const tagsRoute = require("./Routes/tagsRoute")
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const authorRoute = require("./Routes/authorRoute");
const app = express();
app.use(cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json());
app.use(express.static('public'))
app.use("/api/v1/users", userRouter);
app.use("/api/v1/image-upload",imageRoute);
app.use("/blog",blogRoute);
app.use("/author",authorRoute);
app.use("/tags",tagsRoute)
module.exports = app;
