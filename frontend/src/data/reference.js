// Seed users, directors, statutory registers and event-form reference tables.

export const SEED_USERS = [
  { uid: "U001", kind: "employee", name: "Venkata Cherukuri", desig: "Founder & CMD", email: "admin@mytrustlab.com", mobile: "+91 90146 38633", role: "admin", entities: ["TDPL"], status: "active", added: "2026-04-01", last: "2026-07-05" },
  { uid: "U002", kind: "employee", name: "N. Sharma", desig: "CFO — Corporate Services", email: "cfo@mytrustlab.com", mobile: "+91 9XXXX XXXXX", role: "ca", entities: ["TDPL"], status: "active", added: "2026-04-01", last: "2026-07-04" },
  { uid: "U003", kind: "employee", name: "Pallavi Elisetti", desig: "EA to CMD — secretarial coordination", email: "ea.cmd@mytrustlab.com", mobile: "+91 9XXXX XXXXX", role: "cs", entities: ["TDPL"], status: "active", added: "2026-04-01", last: "2026-07-03" },
  { uid: "U004", kind: "employee", name: "S. Iyer", desig: "Quality Manager / MR", email: "quality@mytrustlab.com", mobile: "+91 9XXXX XXXXX", role: "view", entities: ["TDPL"], status: "active", added: "2026-04-10", last: "2026-06-28" },
  { uid: "U005", kind: "employee", name: "K. Rao", desig: "Accounts Executive — Corporate Services", email: "accounts@mytrustlab.com", mobile: "+91 9XXXX XXXXX", role: "ca", entities: ["TDPL"], status: "invited", added: "2026-06-30", last: "" },
  { uid: "U006", kind: "consultant", name: "CA R. Mehta", firm: "R. Mehta & Associates, Chartered Accountants", memno: "ICAI M.No. 2XXXXX", desig: "Engagement partner — tax & audit", email: "rmehta@rmassociates.in", mobile: "+91 9XXXX XXXXX", role: "ca", entities: ["TDPL"], status: "active", valid: "2027-03-31", added: "2026-04-01", last: "2026-07-02" },
  { uid: "U007", kind: "consultant", name: "CS L. Agarwal", firm: "L. Agarwal & Co., Practising Company Secretaries", memno: "ICSI CP No. 1XXXX", desig: "Secretarial compliance & ROC filings", email: "cs@lagarwal.in", mobile: "+91 9XXXX XXXXX", role: "cs", entities: ["TDPL"], status: "active", valid: "2027-03-31", added: "2026-04-01", last: "2026-07-01" },
  { uid: "U008", kind: "consultant", name: "M. Qureshi", firm: "GSTWise Advisors LLP", memno: "ICAI M.No. 4XXXXX", desig: "GST returns & reconciliation support", email: "m.qureshi@gstwise.in", mobile: "+91 9XXXX XXXXX", role: "ca", entities: ["TDPL"], status: "invited", valid: "2026-09-30", added: "2026-06-25", last: "" },
];

export const DIRECTORS = [
  { name: "Venkata Cherukuri", din: "0084xxxx", role: "Managing Director (CMD)", kycCycle: "Filed FY 2025-26 — next routine cycle FY 2028-29", dscExpiry: "2027-03-31", status: "Active" },
  { name: "Director 2 (update)", din: "—", role: "Director", kycCycle: "Verify last filing on MCA V3", dscExpiry: "—", status: "Verify" },
];

export const REGISTERS = [
  { code: "MGT-1", name: "Register of members", ref: "Sec 88", note: "Update on every transfer/transmission; demat reconciliation if thresholds crossed." },
  { code: "—", name: "Register of directors & KMP + their shareholding", ref: "Sec 170", note: "Update within 30 days of any change; align with DIR-12 filings." },
  { code: "MBP-4", name: "Register of contracts & arrangements in which directors are interested", ref: "Sec 189", note: "Enter every related-party contract; place before next board meeting. Includes all arrangements with related parties and group entities." },
  { code: "SH-2", name: "Register of renewed & duplicate share certificates", ref: "Rule 6, Share Capital Rules", note: "" },
  { code: "CHG-7", name: "Register of charges", ref: "Sec 85", note: "Mirror every CHG-1/CHG-4 filing (e.g. Axis Bank OD closure — satisfaction of charge via CHG-4 within 30 days)." },
  { code: "—", name: "Register of loans, guarantees, security & investments", ref: "Sec 186(9)", note: "Any inter-corporate loan, guarantee, security or investment goes here with the board approval trail." },
  { code: "SH-10", name: "Register of buy-back (if any)", ref: "Sec 68", note: "N/A unless triggered." },
  { code: "—", name: "Minutes books — Board, Committee, General meetings", ref: "Sec 118 · SS-1/SS-2", note: "Minutes finalised within 30 days; pages consecutively numbered, signed." },
];

export const EVENT_FORMS = [
  { form: "DIR-12", trigger: "Director appointment / resignation / change in designation", window: "30 days", ref: "Sec 152/168" },
  { form: "MGT-14", trigger: "Special resolutions; certain board resolutions (borrowing, investment limits)", window: "30 days of resolution", ref: "Sec 117" },
  { form: "SH-7", trigger: "Increase in authorised share capital", window: "30 days", ref: "Sec 64" },
  { form: "PAS-3", trigger: "Allotment of shares (incl. ESOP exercise, investor primary infusion)", window: "30 days (15 for private placement)", ref: "Sec 39/42" },
  { form: "INC-22", trigger: "Shift of registered office", window: "30 days", ref: "Sec 12" },
  { form: "CHG-1 / CHG-4", trigger: "Creation / satisfaction of charge (bank facilities)", window: "30 days", ref: "Sec 77/82" },
  { form: "BEN-2", trigger: "Declaration of significant beneficial ownership received (BEN-1)", window: "30 days", ref: "Sec 90" },
  { form: "DPT-3 (one-time)", trigger: "New deposit-like receipt category", window: "Per rules", ref: "Deposit Rules" },
  { form: "MGT-6", trigger: "Declaration of beneficial interest in shares (MGT-4/5 received)", window: "30 days", ref: "Sec 89" },
  { form: "ADT-3", trigger: "Auditor resignation", window: "30 days", ref: "Sec 140" },
];
