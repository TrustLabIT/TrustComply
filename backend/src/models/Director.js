const mongoose = require("mongoose");

// A company director — the DIN & DSC register (secretarial / CS module).
const directorSchema = new mongoose.Schema(
  {
    entity: { type: String, default: "TDPL", index: true },
    name: { type: String, required: true, trim: true },
    din: { type: String, default: "" },
    role: { type: String, default: "" }, // e.g. Managing Director (CMD)
    kycCycle: { type: String, default: "" },
    dscExpiry: { type: String, default: "" },
    status: { type: String, default: "Active" }, // Active / Verify / Inactive
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Director", directorSchema);
