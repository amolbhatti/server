const mongoose = require("mongoose");

const imageSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user"],
  },
  link: {
    type: String,
    required: [true, "image must have a link"],
  },
  key: {
    type: String,
    required: [true, "image must have a key"],
  },
  expiresAt: Date,
});

module.exports = mongoose.model("Image", imageSchema);
