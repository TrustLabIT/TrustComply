const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Application account — used both for login (email + hashed password) and for the
// Settings user register (role, kind, consultant details).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // hashed; never returned by default
    role: { type: String, enum: ["admin", "cs", "ca", "view"], default: "view" },
    kind: { type: String, enum: ["employee", "consultant"], default: "employee" },
    desig: { type: String, default: "" },
    firm: { type: String, default: "" },
    memno: { type: String, default: "" },
    valid: { type: String, default: "" },
    mobile: { type: String, default: "" },
    entities: { type: [String], default: ["TDPL"] },
    status: { type: String, enum: ["invited", "active", "disabled"], default: "active" },
    last: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.uid = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash the password whenever it is set/changed.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
