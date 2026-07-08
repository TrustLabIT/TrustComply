const EmpFiling = require("../models/EmpFiling");

// GET /api/emp-filings?fy=&sub=   → the filing-status overlay rows for a sub-module.
const listEmpFilings = async (req, res, next) => {
  try {
    const { fy, sub } = req.query;
    if (!fy || !sub) {
      res.status(400);
      throw new Error("fy and sub are required");
    }
    const rows = await EmpFiling.find({ entity: req.query.entity || "TDPL", fy, sub });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PUT /api/emp-filings   body: { fy, sub, period, branch?, status?, ref?, filed?, slots? }
// Upserts the overlay row for one period/branch.
const upsertEmpFiling = async (req, res, next) => {
  try {
    const { fy, sub, period } = req.body;
    const branch = req.body.branch || "";
    const entity = req.body.entity || "TDPL";
    if (!fy || !sub || !period) {
      res.status(400);
      throw new Error("fy, sub and period are required");
    }
    const set = {};
    ["status", "ref", "filed", "slots"].forEach((k) => {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    });
    const row = await EmpFiling.findOneAndUpdate(
      { entity, fy, sub, period, branch },
      { $set: set, $setOnInsert: { entity, fy, sub, period, branch } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(row);
  } catch (err) {
    next(err);
  }
};

module.exports = { listEmpFilings, upsertEmpFiling };
