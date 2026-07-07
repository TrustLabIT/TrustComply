const Director = require("../models/Director");

// GET /api/directors
// Filter: search (name/din/role). Pagination: ?page= → { items, total, page, limit, pages }.
const listDirectors = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;

    const q = {};
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      q.$or = [{ name: rx }, { din: rx }, { role: rx }];
    }

    if (page !== undefined) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
      const [items, total] = await Promise.all([
        Director.find(q).sort({ createdAt: 1 }).skip((p - 1) * l).limit(l),
        Director.countDocuments(q),
      ]);
      return res.json({ items, total, page: p, limit: l, pages: Math.ceil(total / l) || 1 });
    }

    const directors = await Director.find(q).sort({ createdAt: 1 });
    res.json(directors);
  } catch (err) {
    next(err);
  }
};

// POST /api/directors
const createDirector = async (req, res, next) => {
  try {
    if (!req.body.name) {
      res.status(400);
      throw new Error("Director name is required");
    }
    const director = await Director.create(req.body);
    res.status(201).json(director);
  } catch (err) {
    next(err);
  }
};

// PUT /api/directors/:id
const updateDirector = async (req, res, next) => {
  try {
    const director = await Director.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!director) {
      res.status(404);
      throw new Error("Director not found");
    }
    res.json(director);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/directors/:id
const deleteDirector = async (req, res, next) => {
  try {
    const director = await Director.findByIdAndDelete(req.params.id);
    if (!director) {
      res.status(404);
      throw new Error("Director not found");
    }
    res.json({ id: req.params.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDirectors, createDirector, updateDirector, deleteDirector };
