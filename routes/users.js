const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate, validateDrawings } = require("../models/user");
const { Drawing } = require("../models/drawing");
const auth = require("../middleware/auth");
const router = express.Router();

const getDrawings = async (drawingsArray) => {
  const drawings = await Drawing.find({ drawingNumber: { $in: drawingsArray } }).select("-grid");
  return drawings;
};

router.get("/drawings", auth, async (req, res) => {
  if (!req.query.numbers) res.status(400).send("Missing numbers data");

  let data = {};
  data.favorites = req.query.numbers.split(",");

  const drawings = await getDrawings(data.favorites);
  res.send(drawings);
});

router.patch("/add-favorite", auth, async (req, res) => {
  try {
    const { error } = validateDrawings(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const drawings = await getDrawings(req.body.favorites);

    //? drawings with these numbers don't exist
    if (drawings.length != req.body.favorites.length) return res.status(403).send("Drawing numbers don't match");

    let user = await User.findById(req.user._id).select("-password");

    if (user.favorites.includes(req.body.favorites[0])) return res.status(403).send("Oops, drawing number must be new");

    user.favorites = _.uniq([...user.favorites, ...req.body.favorites]);

    user = await user.save();
    res.send(user);
  } catch (error) {
    return res.status(400).send("Oops!");
  }
});

router.patch("/delete-favorite", auth, async (req, res) => {
  try {
    const { error } = validateDrawings(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const drawings = await getDrawings(req.body.favorites);

    //? drawings with these numbers don't exist
    if (drawings.length != req.body.favorites.length) return res.status(403).send("Drawing numbers don't match");

    let user = await User.findById(req.user._id).select("-password");

    if (!user.favorites.includes(req.body.favorites[0])) return res.status(403).send("No such drawing exists");

    user.favorites = user.favorites.filter((x) => x !== req.body.favorites[0]);

    user = await user.save();
    res.send(user);
  } catch (error) {
    return res.status(400).send("Oops!");
  }
});

router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select({ password: 0, email: 0, painter: 0 });
  res.send(user);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password", "painter", "favorites"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
