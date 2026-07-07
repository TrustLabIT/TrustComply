const RegisterCheck = require("../models/RegisterCheck");

// GET /api/register-checks?entity=&fy=
const getChecks = async (req, res, next) => {
  try {
    const entity = req.query.entity || "TDPL";
    const { fy } = req.query;
    if (!fy) {
      res.status(400);
      throw new Error("fy is required");
    }
    const doc = await RegisterCheck.findOne({ entity, fy });
    res.json(doc || { entity, fy, checked: [] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/register-checks/toggle   body: { entity, fy, index }
const toggleCheck = async (req, res, next) => {
  try {
    const entity = req.body.entity || "TDPL";
    const { fy, index } = req.body;
    if (fy === undefined || index === undefined) {
      res.status(400);
      throw new Error("fy and index are required");
    }
    let doc = await RegisterCheck.findOne({ entity, fy });
    if (!doc) doc = await RegisterCheck.create({ entity, fy, checked: [] });

    const set = new Set(doc.checked);
    if (set.has(index)) set.delete(index);
    else set.add(index);
    doc.checked = [...set].sort((a, b) => a - b);
    await doc.save();

    res.json(doc);
  } catch (err) {
    next(err);
  }
};

module.exports = { getChecks, toggleCheck };
