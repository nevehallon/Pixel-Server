require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");

const morgan = require("morgan");

const users = require("./routes/users");
const auth = require("./routes/auth");
const drawings = require("./routes/drawings");

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

corsOptions = {
  origin: process.env.BASE_URL || "https://nevehallon.github.io",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
      // JSON.stringify(req.headers),
    ].join(" ");
  })
);

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression({ level: 6, filter: shouldCompress }));
app.use(express.json());

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/drawings", drawings);

mongoose
  .connect("mongodb://localhost/pixels", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error(err, "Could not connect to MongoDB..."));

const PORT = (port = process.env.PORT || 80);
app.listen(PORT, () => console.log(`Working on port ${PORT}`));
