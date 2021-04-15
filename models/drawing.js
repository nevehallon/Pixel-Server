const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const _ = require("lodash");

const gridSchema = new mongoose.Schema({ fill: String, touched: String });

const drawingSchema = new mongoose.Schema({
  drawingName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 26,
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 225,
  },
  grid: {
    type: [gridSchema],
    required: true,
    minlength: 225,
    maxlength: 1225,
  },
  dataUrl: {
    type: String,
    required: true,
    minlength: 225,
    maxlength: 10042,
  },
  drawingNumber: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 99999999999,
    unique: true,
  },
  painterInfo: {
    type: Object,
  },
  shareUrl: {
    type: String,
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Drawing = mongoose.model("Drawing", drawingSchema);

function validateDrawing(drawing) {
  const schema = Joi.object({
    drawingName: Joi.string().min(2).max(26).required(),
    description: Joi.string().min(2).max(225).required(),
    grid: Joi.array()
      .items({ fill: Joi.string(), touched: Joi.allow("", "true") })
      .min(225)
      .max(1225)
      .required(),
    dataUrl: Joi.string().required().label("src"),
  });

  return schema.validate(drawing);
}

async function generateDrawingNumber(Drawing) {
  while (true) {
    let randomNumber = _.random(1000, 999999);
    let drawing = await Drawing.findOne({ drawingNumber: randomNumber });
    if (!drawing) return String(randomNumber);
  }
}

const generateShareUrl = async (dataUrl) => {
  const encodedData = encodeURIComponent(dataUrl);
  return `https://lnkr-two.vercel.app/api/create?u=https://og-image-html.vercel.app/%20?images=${encodedData}`;
};

module.exports = { generateShareUrl, Drawing, validateDrawing, generateDrawingNumber };
