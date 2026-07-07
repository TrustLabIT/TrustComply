const mongoose = require("mongoose");

// An uploaded document attached to a filing (stored inline as a data URI for now).
const docSchema = new mongoose.Schema(
  {
    name: String,
    size: Number,
    type: String,
    added: String,
    data: String, // data: URI
  },
  { _id: false }
);

// A single statutory obligation / deadline. Mirrors the shape the frontend uses.
const filingSchema = new mongoose.Schema(
  {
    entity: { type: String, default: "TDPL", index: true },
    fy: { type: String, required: true, index: true }, // e.g. "2026-27"
    module: { type: String, enum: ["CS", "CA"], required: true },
    cat: { type: String, required: true },
    form: { type: String, required: true },
    title: { type: String, default: "" },
    statute: { type: String, default: "" },
    period: { type: String, default: "" },
    due: { type: String, required: true }, // "YYYY-MM-DD"
    owner: { type: String, default: "" },
    status: { type: String, enum: ["ns", "ip", "ps", "fd", "ak", "na"], default: "ns" },
    ref: { type: String, default: "" },
    filed: { type: String, default: "" },
    penalty: { type: String, default: "none" },
    notes: { type: String, default: "" },
    docs: { type: [docSchema], default: [] },
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

module.exports = mongoose.model("Filing", filingSchema);
