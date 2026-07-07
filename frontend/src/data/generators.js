import { MN } from "./constants";
import { TODAY } from "./helpers";

// ---------------------------------------------------------------------------
// Unique-id generator for filing records. Kept module-scoped so ids stay unique
// across the initial seed and any later FY backfills within a session.
// ---------------------------------------------------------------------------
let SEQ = 1;
export function nid() {
  return "F" + String(SEQ++).padStart(4, "0");
}

export function fyMonths(fy) {
  // Returns [{y, m}] for Apr..Mar of the given financial year.
  const startYear = parseInt(fy.slice(0, 4), 10);
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const m = (3 + i) % 12;
    const y = startYear + (m < 3 ? 1 : 0);
    arr.push({ y, m });
  }
  return arr;
}

export function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ---------- Recurring monthly cycle (GST / TDS / payroll) ----------
export function buildRecurring(entity, fy) {
  const rows = [];
  const months = fyMonths(fy);
  const newAct = parseInt(fy.slice(0, 4), 10) >= 2026;
  months.forEach(({ y, m }) => {
    const per = MN[m] + " " + y;
    const ny = m === 11 ? y + 1 : y;
    const nm = (m + 1) % 12;
    const tdsDue = m === 2 ? iso(y, 3, 30) : iso(ny, nm, 7);
    rows.push({ id: nid(), entity, fy, module: "CA", cat: "TDS / TCS", form: "Challan 281", title: "Monthly TDS/TCS deposit — " + per, statute: newAct ? "Sec 393-series, IT Act 2025 (challan quotes new table items, not 194-series)" : "Sec 194-series, IT Act 1961", period: per, due: tdsDue, owner: "CA — Tax", status: "ns", ref: "", filed: "", penalty: "int1pct", notes: "Interest u/s 201(1A): 1%/mo for late deduction, 1.5%/mo for late deposit." });
    rows.push({ id: nid(), entity, fy, module: "CA", cat: "GST", form: "GSTR-1", title: "Outward supplies — " + per, statute: "Sec 37, CGST Act 2017", period: per, due: iso(ny, nm, 11), owner: "CA — Tax", status: "ns", ref: "", filed: "", penalty: "gstlate", notes: "Feeds buyer GSTR-2B; file before 3B to avoid mismatch notices." });
    rows.push({ id: nid(), entity, fy, module: "CA", cat: "GST", form: "GSTR-3B", title: "Summary return & tax payment — " + per, statute: "Sec 39, CGST Act 2017", period: per, due: iso(ny, nm, 20), owner: "CA — Tax", status: "ns", ref: "", filed: "", penalty: "gstlate", notes: "Table 3.2 auto-populated from GSTR-1 (non-editable since Nov 2025). Two consecutive misses → auto-suspension of GSTIN." });
    rows.push({ id: nid(), entity, fy, module: "CA", cat: "Payroll statutory", form: "EPF ECR + ESIC", title: "PF & ESI deposit — " + per, statute: "EPF & MP Act 1952 · ESI Act 1948", period: per, due: iso(ny, nm, 15), owner: "HR / Payroll", status: "ns", ref: "", filed: "", penalty: "none", notes: "ECR upload + challan; ESIC contribution & return." });
    rows.push({ id: nid(), entity, fy, module: "CA", cat: "Payroll statutory", form: "PT Form V", title: "Professional tax (Telangana) — " + per, statute: "TS Professional Tax Act 1987", period: per, due: iso(ny, nm, 10), owner: "HR / Payroll", status: "ns", ref: "", filed: "", penalty: "none", notes: "Monthly return-cum-challan for employees on rolls in Telangana branches." });
  });
  return rows;
}

// ---------- Annual secretarial (CS) obligations ----------
export function buildAnnualCS(entity, fy) {
  const sy = parseInt(fy.slice(0, 4), 10);
  const prevFY = sy - 1 + "-" + String(sy).slice(2);
  return [
    { module: "CS", cat: "Annual filing", form: "DPT-3", title: "Return of deposits & exempted deposits (o/s as at 31 Mar " + sy + ")", statute: "Rule 16, Companies (Acceptance of Deposits) Rules 2014", period: "FY " + prevFY, due: sy === 2026 ? iso(sy, 6, 31) : iso(sy, 5, 30), penalty: "mca100", notes: "Covers director loans (exempted deposits) and inter-corporate borrowings. Auditor certificate required." + (sy === 2026 ? " FY 2025-26 due date extended to 31 Jul 2026 without additional fees (MCA GC 02/2026, post data-centre outage)." : "") },
    { module: "CS", cat: "Annual filing", form: "MSME-1 (H2)", title: "Half-yearly return — MSME dues outstanding >45 days (Oct–Mar)", statute: "Sec 405, Companies Act 2013 · MSMED Act 2006", period: "Oct " + (sy - 1) + " – Mar " + sy, due: iso(sy, 3, 30), penalty: "msme", notes: "Vendor MSME status to be verified against Udyam registry via Procurement." },
    { module: "CS", cat: "Annual filing", form: "MSME-1 (H1)", title: "Half-yearly return — MSME dues outstanding >45 days (Apr–Sep)", statute: "Sec 405, Companies Act 2013", period: "Apr–Sep " + sy, due: iso(sy, 9, 31), penalty: "msme", notes: "" },
    { module: "CS", cat: "Board & AGM", form: "AGM", title: "Annual General Meeting — adopt FY " + prevFY + " accounts, auditor matters", statute: "Sec 96, Companies Act 2013 (within 6 months of FY end)", period: "FY " + prevFY, due: iso(sy, 8, 30), penalty: "none", notes: "21 clear days notice. Board must approve financials & Board Report beforehand. Confirm auditor tenure — file ADT-1 only if appointment/reappointment." },
    { module: "CS", cat: "Annual filing", form: "ADT-1", title: "Auditor appointment intimation (if appointed/reappointed at AGM)", statute: "Sec 139(1), Companies Act 2013 — within 15 days of AGM", period: "AGM " + sy, due: iso(sy, 9, 15), penalty: "mca100", notes: "Skip (mark N/A) if auditor is mid-tenure with no fresh appointment." },
    { module: "CS", cat: "Annual filing", form: "AOC-4", title: "Financial statements + Board Report + Auditor Report for FY " + prevFY, statute: "Sec 137, Companies Act 2013 — within 30 days of AGM", period: "FY " + prevFY, due: iso(sy, 9, 30), penalty: "mca100", notes: "MCA V3: linked-form filing; attach AOC-2 (related party), CSR annexure if applicable. ₹100/day additional fee, no cap." },
    { module: "CS", cat: "Annual filing", form: "MGT-7", title: "Annual return — shareholding, directors, meetings for FY " + prevFY, statute: "Sec 92, Companies Act 2013 — within 60 days of AGM", period: "FY " + prevFY, due: iso(sy, 10, 29), penalty: "mca100", notes: "MCA V3 requires geotagged, timestamped photo of registered office with visible signage. Shareholding cross-checked against depository data." },
    { module: "CS", cat: "Director KYC / DSC", form: "DIR-3 KYC", title: "Director KYC cycle check — all DIN holders", statute: "Rule 12A, Companies (Appointment & Qualification of Directors) Rules", period: "FY " + fy, due: iso(sy, 8, 30), penalty: "flat5000", notes: "Now TRIENNIAL for compliant directors (MCA notification, FY 2025-26 onward). Event-based: any change in mobile/email/address must be reported within 30 days via DIR-3 KYC-Web. Track each director cycle in DIN register below." },
    { module: "CS", cat: "Board & AGM", form: "Board meetings", title: "Minimum 4 board meetings; gap between two meetings ≤ 120 days", statute: "Sec 173, Companies Act 2013", period: "FY " + fy, due: iso(sy + 1, 2, 31), penalty: "none", notes: "Plan quarterly: Apr–Jun, Jul–Sep (pre-AGM), Oct–Dec, Jan–Mar. Record minutes within 30 days (SS-1)." },
    { module: "CS", cat: "Event-based filing", form: "BEN-2", title: "Significant beneficial ownership — verify no change; file if triggered", statute: "Sec 90, Companies Act 2013", period: "Ongoing", due: iso(sy, 11, 31), penalty: "mca100", notes: "Event-based: within 30 days of receiving BEN-1. Annual sanity check ahead of the exit/investment process — SBO position will be diligence-checked." },
    { module: "CS", cat: "Statutory register", form: "MBP-1 / 184(1)", title: "Directors’ disclosure of interest — first board meeting of FY", statute: "Sec 184(1), Companies Act 2013", period: "FY " + fy, due: iso(sy, 5, 30), penalty: "none", notes: "Fresh MBP-1 from every director at the first board meeting of the FY; record in register of contracts (MBP-4). All directorships and interests in other companies / body corporates must be disclosed." },
  ];
}

// ---------- Annual taxation (CA) obligations ----------
export function buildAnnualCA(entity, fy) {
  const sy = parseInt(fy.slice(0, 4), 10);
  const prevFY = sy - 1 + "-" + String(sy).slice(2);
  const newAct = sy >= 2026;
  const tdsF = (q) => (newAct ? "Form 138 + 140 (" + q + ")" : "24Q + 26Q (" + q + ")");
  const tdsLaw = newAct ? "IT Act 2025" : "Sec 200(3), IT Act 1961 · Rule 31A";
  const itLaw = newAct ? "IT Act 2025" : "IT Act 1961";
  return [
    { module: "CA", cat: "Income tax", form: "Advance tax Q1", title: "1st instalment — 15% of estimated tax, " + (newAct ? "TY " : "FY ") + fy, statute: "Sec 234C interest on shortfall (" + itLaw + ")", period: "TY " + fy, due: iso(sy, 5, 15), penalty: "int1pct", notes: "" },
    { module: "CA", cat: "Income tax", form: "Advance tax Q2", title: "2nd instalment — cumulative 45%", statute: itLaw, period: "TY " + fy, due: iso(sy, 8, 15), penalty: "int1pct", notes: "" },
    { module: "CA", cat: "Income tax", form: "Advance tax Q3", title: "3rd instalment — cumulative 75%", statute: itLaw, period: "TY " + fy, due: iso(sy, 11, 15), penalty: "int1pct", notes: "" },
    { module: "CA", cat: "Income tax", form: "Advance tax Q4", title: "4th instalment — 100%", statute: itLaw, period: "TY " + fy, due: iso(sy + 1, 2, 15), penalty: "int1pct", notes: "" },
    { module: "CA", cat: "TDS / TCS", form: tdsF("Q1"), title: "Quarterly TDS statements Apr–Jun (salary + non-salary)", statute: newAct ? "IT Act 2025 — Form 138 replaces 24Q; Form 140 replaces 26Q" : tdsLaw, period: "Q1 " + fy, due: iso(sy, 6, 31), penalty: "tds234e", notes: newAct ? 'FIRST quarter on new-format forms. Confirm RPU/FVU utilities updated; select "Forms as per Income Tax Act 2025". Form 16A within 15 days of filing.' : "Form 16A within 15 days of filing." },
    { module: "CA", cat: "TDS / TCS", form: tdsF("Q2"), title: "Quarterly TDS statements Jul–Sep", statute: tdsLaw, period: "Q2 " + fy, due: iso(sy, 9, 31), penalty: "tds234e", notes: "" },
    { module: "CA", cat: "TDS / TCS", form: tdsF("Q3"), title: "Quarterly TDS statements Oct–Dec", statute: tdsLaw, period: "Q3 " + fy, due: iso(sy + 1, 0, 31), penalty: "tds234e", notes: "" },
    { module: "CA", cat: "TDS / TCS", form: tdsF("Q4"), title: "Quarterly TDS statements Jan–Mar", statute: tdsLaw, period: "Q4 " + fy, due: iso(sy + 1, 4, 31), penalty: "tds234e", notes: "Form 16 (salary certificate) to employees by 15 Jun following." },
    { module: "CA", cat: "TDS / TCS", form: "Form 16 / 16A cycle", title: "Issue TDS certificates for FY " + prevFY + " — Form 16 by 15 Jun; 16A within 15 days of each quarterly return", statute: "Rule under IT Act", period: "FY " + prevFY, due: iso(sy, 5, 15), penalty: "none", notes: "Penalty ₹100/day/certificate for delay (Sec 272A(2)(g) equivalent)." },
    { module: "CA", cat: "Income tax", form: "Tax audit 3CA-3CD", title: "Tax audit report for FY " + prevFY, statute: "Sec 44AB (audit threshold) — due 30 Sep", period: "FY " + prevFY, due: iso(sy, 8, 30), penalty: "none", notes: "Penalty for failure: 0.5% of turnover, max ₹1,50,000. Coordinate with statutory audit timeline for AGM." },
    { module: "CA", cat: "Income tax", form: "ITR-6", title: "Company income tax return for FY " + prevFY + " (audit case)", statute: "Sec 139(1) — 31 Oct for audited companies", period: "AY " + sy + "-" + String(sy + 1).slice(2), due: iso(sy, 9, 31), penalty: "none", notes: "Carry-forward of losses requires on-time filing — critical for the Sec 72A/79 value in the exit structure." },
    { module: "CA", cat: "Income tax", form: "Form 61A (SFT)", title: "Statement of financial transactions for FY " + prevFY + " (if reportable)", statute: newAct ? "Sec 285BA equivalent, IT Act 2025" : "Sec 285BA, IT Act 1961", period: "FY " + prevFY, due: iso(sy, 4, 31), penalty: "none", notes: "Applicable if reportable transactions (cash receipts > threshold etc.). Mark N/A after annual applicability check." },
    { module: "CA", cat: "GST", form: "GSTR-9", title: "GST annual return for FY " + prevFY, statute: "Sec 44, CGST Act — mandatory if turnover > ₹2 Cr", period: "FY " + prevFY, due: iso(sy, 11, 31), penalty: "gstlate", notes: "Start reconciliation (books vs GSTR-1 vs 3B vs 2B) by October, not December." },
    { module: "CA", cat: "GST", form: "GSTR-9C", title: "Self-certified reconciliation statement for FY " + prevFY, statute: "Sec 44 — if turnover > ₹5 Cr", period: "FY " + prevFY, due: iso(sy, 11, 31), penalty: "gstlate", notes: "" },
    { module: "CA", cat: "GST", form: "RFD-11 (LUT)", title: "Letter of Undertaking renewal for TY " + (sy + 1) + "-" + String(sy + 2).slice(2) + " (if zero-rated supplies)", statute: "Rule 96A, CGST Rules", period: "TY " + (sy + 1) + "-" + String(sy + 2).slice(2), due: iso(sy + 1, 2, 31), penalty: "none", notes: "Only if exports / SEZ supplies without payment of IGST. Mark N/A otherwise." },
    { module: "CA", cat: "GST", form: "ITC annual true-up", title: "Rule 42/43 ITC reversal computation — exempt vs taxable turnover", statute: "Rule 42/43, CGST Rules", period: "FY " + prevFY, due: iso(sy, 8, 30), penalty: "none", notes: "Critical for a diagnostics business: healthcare services are exempt, so common-credit reversal must be trued up annually (due with Sep return following FY end)." },
  ];
}

// Assemble an annual (non-recurring) record into a full DB row.
function annualRow(entity, fy, r, opts = {}) {
  return {
    id: nid(),
    entity,
    fy,
    owner: r.module === "CS" ? "Company Secretary" : "CA — Tax",
    status: "ns",
    ref: "",
    filed: "",
    ...r,
    ...opts,
  };
}

// ---------- Initial seed database (current FY 2026-27, realistic starting position) ----------
export function seed() {
  SEQ = 1;
  const db = [];
  const ent = "TDPL";
  const fy = "2026-27";
  buildRecurring(ent, fy).forEach((r) => db.push(r));
  buildAnnualCS(ent, fy).forEach((r) => db.push(annualRow(ent, fy, r)));
  buildAnnualCA(ent, fy).forEach((r) => db.push(annualRow(ent, fy, r, { owner: "CA — Tax" })));

  // Mark a realistic starting position — the Apr–Jun recurring cycle already run.
  db.filter(
    (r) =>
      new Date(r.due) < TODAY &&
      ["Challan 281", "GSTR-1", "GSTR-3B", "EPF ECR + ESIC", "PT Form V"].includes(r.form)
  ).forEach((r) => {
    r.status = "ak";
    r.filed = r.due;
    r.ref = "(seed) verify & attach ack";
  });
  const dpt = db.find((r) => r.form === "DPT-3");
  if (dpt) {
    dpt.status = "fd";
    dpt.filed = "2026-06-28";
    dpt.ref = "SRN pending verification";
  }
  const at1 = db.find((r) => r.form === "Advance tax Q1");
  if (at1) {
    at1.status = "ak";
    at1.filed = "2026-06-15";
    at1.ref = "Challan CIN on record";
  }
  return db;
}

// ---------- Historical / future FY backfill skeleton ----------
export function buildBackfill(entity, fy) {
  const rows = [];
  const isPast = parseInt(fy.slice(0, 4), 10) < 2026;
  buildRecurring(entity, fy).forEach((r) => {
    if (isPast) {
      r.status = "fd";
      r.filed = r.due;
    }
    rows.push(r);
  });
  buildAnnualCS(entity, fy).forEach((r) =>
    rows.push(annualRow(entity, fy, r, { status: isPast ? "fd" : "ns", filed: isPast ? r.due : "" }))
  );
  buildAnnualCA(entity, fy).forEach((r) =>
    rows.push(annualRow(entity, fy, r, { owner: "CA — Tax", status: isPast ? "fd" : "ns", filed: isPast ? r.due : "" }))
  );
  if (fy === "2020-21") {
    [
      { module: "CS", cat: "Event-based filing", form: "INC-20A", title: "Declaration of commencement of business (incorporation year)", statute: "Sec 10A, Companies Act 2013 — within 180 days of incorporation", period: "FY 2020-21", due: "2020-12-31", notes: "Set the actual due date from the certificate of incorporation (+180 days). Attach the filed form and SRN." },
      { module: "CS", cat: "Board & AGM", form: "First auditor", title: "First auditor appointment by the Board", statute: "Sec 139(6) — within 30 days of incorporation (members within 90 days if Board fails)", period: "FY 2020-21", due: "2020-12-31", notes: "Board resolution + consent letter. ADT-1 for first auditor was optional practice; attach whatever was filed." },
      { module: "CS", cat: "Board & AGM", form: "First AGM", title: "First AGM — within 9 months of end of first financial year", statute: "Sec 96 proviso", period: "FY 2020-21", due: "2021-12-31", notes: "First-year AGM clock differs from the standard 30 Sep cycle; AOC-4/MGT-7 flow from the actual first AGM date. Adjust the generic AGM/AOC-4/MGT-7 rows in this FY to the real dates." },
    ].forEach((r) =>
      rows.push(annualRow(entity, fy, r, { owner: "Company Secretary", status: "fd", filed: r.due, penalty: "mca100" }))
    );
  }
  return { rows, isPast };
}
