const mongoose = require("mongoose");

// App-wide key-value settings (e.g. login_title, login_department for the
// sign-in screen). One document per key; values are plain strings.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
