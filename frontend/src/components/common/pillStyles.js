import { tokens } from "../../theme";

// Colour recipes for status pills and tags, mirroring the original .pill.* CSS.
export const PILL_STYLES = {
  ns: { bg: "#EEF1F0", fg: tokens.muted },
  ip: { bg: tokens.blueTint, fg: tokens.blue },
  ps: { bg: tokens.violetTint, fg: tokens.violet },
  fd: { bg: tokens.goldTint, fg: "#8a6410" },
  ak: { bg: tokens.tealTint, fg: tokens.tealDark },
  od: { bg: tokens.redTint, fg: tokens.red },
  na: { bg: "#EEF1F0", fg: "#9aa6a1", strike: true },
};

export const pillSx = (kind) => {
  const s = PILL_STYLES[kind] || PILL_STYLES.ns;
  return {
    display: "inline-block",
    borderRadius: "20px",
    px: 1.25,
    py: "2px",
    fontSize: "11.5px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    bgcolor: s.bg,
    color: s.fg,
    textDecoration: s.strike ? "line-through" : "none",
    lineHeight: 1.5,
  };
};

// Tag colours for the small CS/CA module chips.
export const tagSx = (kind) => {
  const map = {
    cs: { bg: tokens.goldTint, fg: "#8a6410" },
    ca: { bg: tokens.tealTint, fg: tokens.tealDark },
  };
  const s = map[kind] || map.ca;
  return {
    display: "inline-block",
    fontFamily: "'Space Mono', monospace",
    fontSize: "10px",
    borderRadius: "5px",
    px: 0.75,
    py: "1px",
    letterSpacing: "0.04em",
    bgcolor: s.bg,
    color: s.fg,
  };
};
