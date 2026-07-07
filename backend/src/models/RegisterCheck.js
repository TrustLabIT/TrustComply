const mongoose = require("mongoose");

// The "verified" state of the statutory-registers checklist, per entity + financial
// year. `checked` holds the indices of the registers that have been ticked.
const registerCheckSchema = new mongoose.Schema(
  {
    entity: { type: String, default: "TDPL" },
    fy: { type: String, required: true },
    checked: { type: [Number], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One checklist document per entity + FY.
registerCheckSchema.index({ entity: 1, fy: 1 }, { unique: true });

module.exports = mongoose.model("RegisterCheck", registerCheckSchema);
