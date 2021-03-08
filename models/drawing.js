const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const _ = require("lodash");

const gridSchema = new mongoose.Schema({ fill: String, touched: String });

const drawingSchema = new mongoose.Schema({
  drawingName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 1024,
  },
  grid: {
    type: [gridSchema],
    required: true,
    minlength: 225,
    maxlength: 1225,
  },
  drawingNumber: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 99999999999,
    unique: true,
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Drawing = mongoose.model("Drawing", drawingSchema);

function validateDrawing(drawing) {
  const schema = Joi.object({
    drawingName: Joi.string().min(2).max(255).required(),
    description: Joi.string().min(2).max(1024).required(),
    grid: Joi.array()
      .items({ fill: Joi.string(), touched: Joi.allow("", "true") })
      .min(225)
      .max(1225)
      .required(),
  });

  return schema.validate(drawing);
}

async function generateDrawingNumber(Drawing) {
  while (true) {
    let randomNumber = _.random(1000, 999999);
    let drawing = await Drawing.findOne({ painterNumber: randomNumber });
    if (!drawing) return String(randomNumber);
  }
}

exports.Drawing = Drawing;
exports.validateDrawing = validateDrawing;
exports.generateDrawingNumber = generateDrawingNumber;
