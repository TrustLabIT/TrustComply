// Static definitions shared across the app (roles, categories, status labels, navigation).

export const ROLE_DEF = {
  admin: { label: "Administrator", modules: ["CS", "CA"], edit: true, settings: true },
  cs: { label: "Secretarial editor", modules: ["CS"], edit: true, settings: false },
  ca: { label: "Tax editor", modules: ["CA"], edit: true, settings: false },
  view: { label: "Viewer (read-only)", modules: ["CS", "CA"], edit: false, settings: false },
};

export const CATS = {
  CS: [
    "Annual filing",
    "Event-based filing",
    "Board & AGM",
    "Director KYC / DSC",
    "Statutory register",
    "Other secretarial",
  ],
  CA: ["TDS / TCS", "GST", "Income tax", "Payroll statutory", "Other tax"],
};

export const STATUS_LABEL = {
  ns: "Not started",
  ip: "In preparation",
  ps: "Pending sign-off",
  fd: "Filed",
  ak: "Acknowledged",
  na: "N/A",
};

// Status pill colour key (maps to a "pill.<key>" style helper).
export const STATUS_PILL = {
  ns: "ns",
  ip: "ip",
  ps: "ps",
  fd: "fd",
  ak: "ak",
  na: "na",
};

export const OWNERS = [
  "Company Secretary",
  "CA — Tax",
  "CFO (N. Sharma)",
  "HR / Payroll",
  "CMD Office",
];

export const PENALTY_OPTIONS = [
  { value: "none", label: "None / not tracked" },
  { value: "mca100", label: "MCA additional fee — ₹100/day, no cap" },
  { value: "tds234e", label: "TDS late filing — ₹200/day (Sec 234E), capped at TDS amount" },
  { value: "gstlate", label: "GST late fee — ₹50/day (₹20 nil) + 18% p.a. interest" },
  { value: "flat5000", label: "Flat ₹5,000 (e.g. DIR-3 KYC reactivation)" },
  { value: "msme", label: "MSME-1 — up to ₹20,000 + daily fine on directors" },
  { value: "int1pct", label: "Interest 1%/month (Sec 234B/234C advance tax)" },
];

export const MN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const FY_OPTIONS = [
  "2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
];

// Rail navigation. `sec` entries are section headers; `id` maps to a route path.
export const NAV = [
  { sec: "Overview" },
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "calendar", label: "Compliance calendar", path: "/calendar" },
  { sec: "Secretarial — CS" },
  { id: "cs-annual", label: "Annual MCA filings", path: "/cs/annual" },
  { id: "cs-event", label: "Event-based filings", path: "/cs/event" },
  { id: "cs-board", label: "Board & AGM", path: "/cs/board" },
  { id: "cs-din", label: "Directors · DIN & DSC", path: "/cs/din" },
  { id: "cs-registers", label: "Statutory registers", path: "/cs/registers" },
  { sec: "Taxation — CA" },
  { id: "ca-tds", label: "TDS / TCS", path: "/ca/tds" },
  { id: "ca-gst", label: "GST", path: "/ca/gst" },
  { id: "ca-it", label: "Income tax", path: "/ca/it" },
  { sec: "Employment Statutory" },
  { id: "ca-payroll", label: "Payroll statutory", path: "/ca/payroll" },
  { sec: "Medical Statutory", always: true },
  { sec: "Records" },
  { id: "archive", label: "SRN / ARN archive", path: "/archive" },
  { id: "regime", label: "2026 regulatory watch", path: "/regime" },
  { sec: "Administration" },
  { id: "settings", label: "Settings & access", path: "/settings" },
];

// Maps a nav id to a predicate that selects the rows counted in its rail badge.
export const NAV_COUNTS = {
  "cs-annual": (r) => r.module === "CS" && r.cat === "Annual filing",
  "cs-event": (r) => r.module === "CS" && r.cat === "Event-based filing",
  "cs-board": (r) => r.module === "CS" && r.cat === "Board & AGM",
  "ca-tds": (r) => r.cat === "TDS / TCS",
  "ca-gst": (r) => r.cat === "GST",
  "ca-it": (r) => r.cat === "Income tax",
  "ca-payroll": (r) => r.cat === "Payroll statutory",
};

export const nextStatus = (s) => ({ ns: "ip", ip: "ps", ps: "fd", fd: "ak" }[s]);
export const advLabel = (s) =>
  ({ ns: "Start prep", ip: "To sign-off", ps: "Mark filed", fd: "Ack received" }[s]);
