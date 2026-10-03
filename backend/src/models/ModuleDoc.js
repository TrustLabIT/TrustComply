const mongoose = require("mongoose");

// Generic document store backing the TruFin Accounts (Balance Sheet) and TruFin
// Secretarial modules. Each record is one document of one collection of one app
// (e.g. app "accounts", col "years", docId "2025-26"). The payload is kept as a
// JSON string so arbitrary keys (dots, colons, "$") never trip MongoDB.
const moduleDocSchema = new mongoose.Schema(
  {
    app: { type: String, required: true },
    col: { type: String, required: true },
    docId: { type: String, required: true },
    json: { type: String, default: "{}" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

moduleDocSchema.index({ app: 1, col: 1, docId: 1 }, { unique: true });

module.exports = mongoose.model("ModuleDoc", moduleDocSchema);
