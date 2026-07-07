const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

// POST /api/auth/register
// Creates an account. The very first account becomes an admin so the app can be
// bootstrapped; later accounts default to the requested role (or "view").
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(400);
      throw new Error("An account with this email already exists");
    }
    const count = await User.countDocuments();
    const user = await User.create({
      name,
      email,
      password,
      role: count === 0 ? "admin" : role || "view",
      kind: "employee",
      status: "active",
    });
    res.status(201).json({ token: signToken(user.id), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    if (user.status === "disabled") {
      res.status(403);
      throw new Error("Account disabled");
    }
    user.last = new Date().toISOString().slice(0, 10);
    await user.save();
    res.json({ token: signToken(user.id), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — current user from the token.
const me = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

module.exports = { register, login, me };
