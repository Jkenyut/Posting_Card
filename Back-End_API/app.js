const express = require("express");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const app = express();
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const cors = require(`cors`);
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
app.use(bodyParser.urlencoded()); //x-www-form-uploded<form>
app.use(bodyParser.json()); //application/json
var { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const isAuth = require("./middleware/auth");
const { clearImageUrl } = require("./util/file");
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(isAuth);
app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error("Not authentication");
    error.code = 422;
    throw error;
  }
  if (!req.file) {
    return res.status(200).json({ message: "image not upload" });
  }
  if (req.body.oldPath) {
    clearImageUrl(req.body.oldPath);
  }
  return res.status(201).json({
    message: "file stored",
    filePath: req.file.path.replace("\\", "/"),
  });
});
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occurred";
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    },
  })
);

app.use((error, req, res, next) => {
  console.log("error yang mana", error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  console.log("kode", status, message, data);
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect("mongodb+srv://satria:root@cluster0.fzxvxzs.mongodb.net/messages")
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
