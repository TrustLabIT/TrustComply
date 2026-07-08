// Read-only proxy to PACE (trust-people) payroll statutory API. Keeps the PACE
// api_key server-side and maps our financial year (Apr–Mar) onto PACE's calendar
// months so the frontend gets one clean FY-aligned list.

const PACE_URL = process.env.PACE_API_URL;
const PACE_KEY = process.env.PACE_API_KEY;

async function fetchPaceYear(year) {
  // Missing config → treat as unreachable (so the UI shows an error, not "empty").
  if (!PACE_URL || !PACE_KEY) return null;
  const url = `${PACE_URL}/statutory/payroll?year=${year}&api_key=${encodeURIComponent(PACE_KEY)}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    // PACE auth failure / server error → unreachable (bad or missing API key).
    if (!json || json.success === false) return null;
    if (!Array.isArray(json.data)) return [];
    return json.data;
  } catch (e) {
    return null; // network error / PACE down
  }
}

// GET /api/payroll-sync?fy=2026-27
const syncPayroll = async (req, res, next) => {
  try {
    const fy = req.query.fy;
    if (!fy) {
      res.status(400);
      throw new Error("fy is required (e.g. 2026-27)");
    }
    const sy = parseInt(fy.slice(0, 4), 10); // FY start year

    const [y1, y2] = await Promise.all([fetchPaceYear(sy), fetchPaceYear(sy + 1)]);
    if (y1 === null && y2 === null) {
      return res.json({ fy, reachable: false, months: [] });
    }

    // Keep Apr(sy)–Dec(sy) + Jan(sy+1)–Mar(sy+1), only months that actually have payroll.
    const all = [...(y1 || []), ...(y2 || [])].filter(
      (m) =>
        ((m.year === sy && m.month >= 4) || (m.year === sy + 1 && m.month <= 3)) &&
        (m.employees > 0 || m.gross > 0)
    );

    // Sort in FY order: Apr → Mar.
    const fyIndex = (m) => (m.month >= 4 ? m.month - 4 : m.month + 8);
    all.sort((a, b) => fyIndex(a) - fyIndex(b));

    res.json({ fy, reachable: true, months: all });
  } catch (err) {
    next(err);
  }
};

module.exports = { syncPayroll };
