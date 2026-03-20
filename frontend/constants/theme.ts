import { createTheme } from "@mui/material/styles";

export const HOME_THEME = createTheme({
  palette: {
    primary: { main: "#137fec" },
    background: { default: "#f8fafc" }
  },
  typography: {
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", "Noto Sans Arabic", "Noto Sans Hebrew", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
  },
  shape: { borderRadius: 4 }
});
