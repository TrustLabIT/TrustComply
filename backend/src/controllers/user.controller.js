const User = require("../models/User");

// Fields an admin is allowed to set/change on a user.
const EDITABLE = ["name", "email", "role", "kind", "desig", "firm", "memno", "valid", "mobile", "status"];

// GET /api/users
// Filters: search (name/email/firm), role, status, kind.
// Pagination: ?page= → { items, total, page, limit, pages, stats }; else full array.
// `stats` always reflects ALL accounts (for the KPI tiles), regardless of the filter.
const listUsers = async (req, res, next) => {
  try {
    const { search, role, status, kind, page, limit } = req.query;

    const q = {};
    if (role) q.role = role;
    if (status) q.status = status;
    if (kind) q.kind = kind;
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      q.$or = [{ name: rx }, { email: rx }, { firm: rx }];
    }

    // Overall stats (whole collection).
    const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const [total, active, invited, expiring] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "invited" }),
      User.countDocuments({ kind: "consultant", valid: { $ne: "", $lte: in90 } }),
    ]);
    const stats = { total, active, invited, expiring };

    if (page !== undefined) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const [items, filtered] = await Promise.all([
        User.find(q).sort({ createdAt: 1 }).skip((p - 1) * l).limit(l),
        User.countDocuments(q),
      ]);
      return res.json({ items, total: filtered, page: p, limit: l, pages: Math.ceil(filtered / l) || 1, stats });
    }

    const users = await User.find(q).sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// POST /api/users  (admin creates an account; password is required so they can log in)
const createUser = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!req.body.name || !req.body.email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }
    const data = { password };
    EDITABLE.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const user = await User.create(data);
    res.status(201).json(user.toJSON());
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error("An account with this email already exists"));
    }
    next(err);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    const isSelf = String(user._id) === String(req.user._id);

    EDITABLE.forEach((k) => { if (req.body[k] !== undefined) user[k] = req.body[k]; });

    // You cannot downgrade or disable your own account.
    if (isSelf) {
      user.role = "admin";
      user.status = "active";
    }
    // Optional password reset.
    if (req.body.password) user.password = req.body.password;

    await user.save();
    res.json(user.toJSON());
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error("An account with this email already exists"));
    }
    next(err);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      res.status(400);
      throw new Error("You cannot remove your own account");
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({ uid: req.params.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, createUser, updateUser, deleteUser };
