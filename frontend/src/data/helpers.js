import { MN, STATUS_LABEL } from "./constants";

// "Today" pinned to local midnight — the single reference point for all due-date maths.
export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export function fmt(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${MN[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function daysTo(d) {
  return Math.round((new Date(d) - TODAY) / 86400000);
}

// An obligation is "open" until it is filed, acknowledged, or marked not-applicable.
export function isOpen(r) {
  return !["fd", "ak", "na"].includes(r.status);
}

export function isOverdue(r) {
  return isOpen(r) && daysTo(r.due) < 0;
}

export function penaltyEstimate(r) {
  if (!isOverdue(r)) return 0;
  const days = -daysTo(r.due);
  switch (r.penalty) {
    case "mca100":
      return days * 100;
    case "tds234e":
      return days * 200;
    case "gstlate":
      return days * 50;
    case "flat5000":
      return 5000;
    case "msme":
      return 20000;
    default:
      return 0;
  }
}

export function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

export function statusText(r) {
  return STATUS_LABEL[r.status] || r.status;
}

// File-size / extension helpers for the document uploader.
export function fsize(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(0) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

export function dext(name) {
  const p = String(name).split(".");
  return p.length > 1 ? p.pop().toUpperCase().slice(0, 4) : "DOC";
}
