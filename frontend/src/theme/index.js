import { createTheme } from "@mui/material/styles";

/**
 * Brand tokens — mirror of the CSS custom properties in the original design.
 * Exposed on theme.palette.brand so every component can read them via the theme.
 */
export const tokens = {
  teal: "#00B49A",
  tealDark: "#008E7A",
  tealTint: "#E4F7F3",
  gold: "#F0B429",
  goldTint: "#FDF3DC",
  green: "#1A3A2A",
  greenDeep: "#0F2419",
  ink: "#1C2321",
  muted: "#5C6B66",
  line: "#DFE7E4",
  bg: "#F5F8F7",
  card: "#FFFFFF",
  red: "#D64545",
  redTint: "#FBE9E9",
  amber: "#C77D0A",
  amberTint: "#FBF1DE",
  blue: "#2D6CDF",
  blueTint: "#E8EFFC",
  violet: "#7A4FD0",
  violetTint: "#F0EAFB",
  radius: 12,
};

export const FONT_SANS = "'DM Sans', Arial, sans-serif";
export const FONT_DISPLAY = "'Bebas Neue', 'DM Sans', sans-serif";
export const FONT_MONO = "'Space Mono', monospace";

const displayVariant = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 400,
  letterSpacing: "0.04em",
  color: tokens.green,
  lineHeight: 1.05,
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: tokens.teal, dark: tokens.tealDark, contrastText: "#ffffff" },
    secondary: { main: tokens.gold, contrastText: tokens.greenDeep },
    success: { main: tokens.tealDark },
    error: { main: tokens.red },
    warning: { main: tokens.amber },
    info: { main: tokens.blue },
    text: { primary: tokens.ink, secondary: tokens.muted },
    background: { default: tokens.bg, paper: tokens.card },
    divider: tokens.line,
    brand: tokens,
  },
  shape: { borderRadius: tokens.radius },
  typography: {
    fontFamily: FONT_SANS,
    fontSize: 14.5,
    htmlFontSize: 16,
    body1: { fontSize: "14.5px", lineHeight: 1.55 },
    body2: { fontSize: "13px", lineHeight: 1.55 },
    h1: { ...displayVariant, fontSize: "34px" },
    h2: { ...displayVariant, fontSize: "22px" },
    h3: { ...displayVariant, fontSize: "19px" },
    h4: { fontFamily: FONT_SANS, fontSize: "14.5px", fontWeight: 700, color: tokens.green },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg, color: tokens.ink },
        "::selection": { background: tokens.goldTint },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,.15)", borderRadius: 4 },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTableCell: { styleOverrides: { root: { borderColor: tokens.line } } },
  },
});

export default theme;
