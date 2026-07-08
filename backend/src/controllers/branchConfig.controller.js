const BranchConfig = require("../models/BranchConfig");

// GET /api/branch-configs
const listBranchConfigs = async (req, res, next) => {
  try {
    const rows = await BranchConfig.find({ entity: req.query.entity || "TDPL" });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PUT /api/branch-configs   body: { branch, esiCode?, ptRegn?, state?, ptDueDay?, active? }
const upsertBranchConfig = async (req, res, next) => {
  try {
    const branch = req.body.branch;
    const entity = req.body.entity || "TDPL";
    if (!branch) {
      res.status(400);
      throw new Error("branch is required");
    }
    const set = {};
    ["esiCode", "ptRegn", "state", "ptDueDay", "active"].forEach((k) => {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    });
    const row = await BranchConfig.findOneAndUpdate(
      { entity, branch },
      { $set: set, $setOnInsert: { entity, branch } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(row);
  } catch (err) {
    next(err);
  }
};

module.exports = { listBranchConfigs, upsertBranchConfig };
