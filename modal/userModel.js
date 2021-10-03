const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
  },
  email: {
    type: String,
    required: {
      values: true,
      message: "Please provide your email",
    },
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //This works on CREATE and SAVE.
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },

  otp: Number,
  expiretime: Date,
  isVerified: {
    type: Boolean,
    default: false,
    select: true,
  },
});

// MIDDLEWARE
// DOCUMENT MIDDLEWARE
userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 12);
  this.otp = Math.floor(1000 + Math.random() * 9000);
  this.expiretime = Date.now() + 10 * 60 * 1000;

  this.passwordConfirm = undefined;
  next();
});

// INSTANCE METHODS
// used in signin controller
userSchema.methods.correctPassword = async function (
  normalPassword,
  encryptPassword
) {
  return await bcrypt.compare(normalPassword, encryptPassword);
};

module.exports = mongoose.model("User", userSchema);
