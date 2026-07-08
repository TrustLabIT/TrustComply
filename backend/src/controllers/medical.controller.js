// Read-only proxy to TAMS (medical licence system). Keeps the TAMS API key
// server-side (sent as X-API-Key) and forwards the JSON to the frontend.

const TAMS_URL = process.env.TAMS_API_URL;
const TAMS_KEY = process.env.TAMS_API_KEY;

async function tamsGet(path, query) {
  if (!TAMS_URL || !TAMS_KEY) {
    const e = new Error("TAMS integration is not configured (TAMS_API_URL / TAMS_API_KEY).");
    e.statusCode = 503;
    throw e;
  }
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, v);
  });
  const qs = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${TAMS_URL}${path}${qs}`, {
    headers: { "X-API-Key": TAMS_KEY, Accept: "application/json" },
  });
  if (!res.ok) {
    const e = new Error(`TAMS request failed (HTTP ${res.status}).`);
    e.statusCode = res.status === 401 ? 502 : 502;
    throw e;
  }
  return res.json();
}

// GET /api/medical/licence/summary  (optional ?location=)
const licenceSummary = async (req, res, next) => {
  try {
    const data = await tamsGet("/medical-licenses/summary", { location: req.query.location });
    res.json(data);
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// GET /api/medical/licence/list  (optional ?license_type= & ?location=)
const licenceList = async (req, res, next) => {
  try {
    const data = await tamsGet("/medical-licenses", {
      license_type: req.query.license_type,
      location: req.query.location,
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

module.exports = { licenceSummary, licenceList };
