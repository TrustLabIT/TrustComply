const mongoose = require("mongoose");

// Compliance config for each PACE branch — the metadata PACE does NOT store.
// Keyed by the branch NAME as it comes from PACE, so amounts (from PACE) map to
// the ESI sub-code / PT registration / state / due-day held here.
const branchConfigSchema = new mongoose.Schema(
  {
    entity: { type: String, default: "TDPL", index: true },
    branch: { type: String, required: true }, // matches PACE branch name
    esiCode: { type: String, default: "" }, // ESI sub-code for this branch
    ptRegn: { type: String, default: "" }, // PT registration (PTIN/PTRC)
    state: { type: String, default: "" },
    ptDueDay: { type: Number, default: 10 }, // PT due day-of-month (state-specific)
    active: { type: Boolean, default: true },
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

branchConfigSchema.index({ entity: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("BranchConfig", branchConfigSchema);
