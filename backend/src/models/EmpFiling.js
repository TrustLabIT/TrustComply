const mongoose = require("mongoose");

// The TrustComply-side overlay for employment-statutory remittances (EPFO / ESI / PT).
// AMOUNTS are never stored here — they come live from PACE. This only tracks the
// filing status, reference number, and the 3 supporting documents per period/branch.
const empFilingSchema = new mongoose.Schema(
  {
    entity: { type: String, default: "TDPL", index: true },
    fy: { type: String, required: true, index: true }, // "2026-27"
    sub: { type: String, enum: ["EPFO", "ESI", "PT"], required: true },
    period: { type: String, required: true }, // PACE period, e.g. "2026-05"
    branch: { type: String, default: "" }, // "" = consolidated (EPFO); branch name for ESI/PT
    status: { type: String, enum: ["ns", "ip", "ps", "fd", "ak", "na"], default: "ns" },
    ref: { type: String, default: "" },
    filed: { type: String, default: "" },
    // { challan: {...}, account: {...}, receipt: {...} } — each a data-URI doc
    slots: { type: mongoose.Schema.Types.Mixed, default: {} },
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

empFilingSchema.index({ entity: 1, fy: 1, sub: 1, period: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("EmpFiling", empFilingSchema);
