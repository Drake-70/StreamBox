const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    ageGroup: {
      type: String,
      enum: ["kids", "teens", "adults"],
      default: "adults",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    parentalControl: {
      enabled: { type: Boolean, default: false },
      pin: { type: String, default: null },
    },
    premium: {
      active: { type: Boolean, default: false },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
    watchHistory: [
      {
        content: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },
        watchedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Parental-control PIN helpers
userSchema.methods.setParentalPin = async function (pin) {
  if (!pin) {
    this.parentalControl = { enabled: false, pin: null };
    return;
  }
  this.parentalControl = {
    enabled: true,
    pin: await bcrypt.hash(String(pin), 10),
  };
};

userSchema.methods.verifyParentalPin = async function (pin) {
  if (!this.parentalControl || !this.parentalControl.pin) return false;
  return bcrypt.compare(String(pin), this.parentalControl.pin);
};

userSchema.methods.hasParentalPin = function () {
  return !!(this.parentalControl && this.parentalControl.pin);
};

module.exports = mongoose.model("User", userSchema);
