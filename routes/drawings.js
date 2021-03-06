const express = require("express");
const _ = require("lodash");
const { Drawing, validateDrawing, generateDrawingNumber, generateShareUrl } = require("../models/drawing");
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/my-drawings", auth, async (req, res) => {
  if (!req.user.painter) {
    return res.status(401).send("Access Denied.");
  }

  const drawings = await Drawing.find({ user_id: req.user._id }, { grid: 0 });
  if (!drawings) return res.status(404).send("No drawing with the given ID was not found.");
  res.send(drawings);
});

router.delete("/:id", auth, async (req, res) => {
  const drawing = await Drawing.findOneAndRemove({ _id: req.params.id, user_id: req.user._id });
  if (!drawing) return res.status(404).send("The drawing with the given ID was not found.");
  res.send(drawing);
});

router.put("/:id", auth, async (req, res) => {
  const { error } = validateDrawing(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let drawing = await Drawing.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, req.body);
  if (!drawing) return res.status(404).send("The drawing with the given ID was not found.");

  drawing = await Drawing.findOne({ _id: req.params.id, user_id: req.user._id });
  res.send(drawing);
});

router.get("/:id", auth, async (req, res) => {
  const drawing = await Drawing.findOne({ _id: req.params.id, user_id: req.user._id }, { grid: { _id: 0 } });
  if (!drawing) return res.status(404).send("The drawing with the given ID was not found.");
  res.send(drawing);
});

router.post("/", auth, async (req, res) => {
  try {
    const { error } = validateDrawing(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { drawingName, description, grid, dataUrl } = req.body;

    const user = await User.findById(req.user._id).select({ password: 0, email: 0, painter: 0 });

    const longUrl = await generateShareUrl(dataUrl);

    const response = await fetch(longUrl);
    const { link: shareUrl } = await response.json();

    let drawing = new Drawing({
      drawingName,
      description,
      grid,
      dataUrl,
      shareUrl: await shareUrl,
      drawingNumber: await generateDrawingNumber(Drawing),
      user_id: req.user._id,
      painterInfo: user,
    });

    post = await drawing.save();
    res.send(post);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
});

module.exports = router;
