const Filing = require("../models/Filing");

// GET /api/filings
// Filters: fy, entity, status (or "_od" = overdue only), owner, module, cat, search.
// Pagination: when ?page= is supplied, returns { items, total, page, limit, pages };
// otherwise returns the full array (used by the dashboard/calendar/archive aggregates).
const listFilings = async (req, res, next) => {
  try {
    const { fy, entity, status, owner, module: mod, cat, search, page, limit } = req.query;

    const q = {};
    if (fy) q.fy = fy;
    if (entity) q.entity = entity;
    if (owner) q.owner = owner;
    if (mod) q.module = mod;
    if (cat) q.cat = cat;

    if (status === "_od") {
      // Overdue = still open and past its due date (ISO date strings sort lexically).
      q.status = { $nin: ["fd", "ak", "na"] };
      q.due = { $lt: new Date().toISOString().slice(0, 10) };
    } else if (status) {
      q.status = status;
    }

    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      q.$or = [{ form: rx }, { title: rx }, { period: rx }];
    }

    // Paginated mode
    if (page !== undefined) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
      const [items, total] = await Promise.all([
        Filing.find(q).sort({ due: 1 }).skip((p - 1) * l).limit(l),
        Filing.countDocuments(q),
      ]);
      return res.json({ items, total, page: p, limit: l, pages: Math.ceil(total / l) || 1 });
    }

    // Full list (backward compatible)
    const filings = await Filing.find(q).sort({ due: 1 });
    res.json(filings);
  } catch (err) {
    next(err);
  }
};

// POST /api/filings
const createFiling = async (req, res, next) => {
  try {
    const filing = await Filing.create(req.body);
    res.status(201).json(filing);
  } catch (err) {
    next(err);
  }
};

// PUT /api/filings/:id
const updateFiling = async (req, res, next) => {
  try {
    const filing = await Filing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!filing) {
      res.status(404);
      throw new Error("Filing not found");
    }
    res.json(filing);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/filings/:id
const deleteFiling = async (req, res, next) => {
  try {
    const filing = await Filing.findByIdAndDelete(req.params.id);
    if (!filing) {
      res.status(404);
      throw new Error("Filing not found");
    }
    res.json({ id: req.params.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listFilings, createFiling, updateFiling, deleteFiling };
