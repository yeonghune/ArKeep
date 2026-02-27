import { createTheme } from "@mui/material/styles";

export const HOME_THEME = createTheme({
  palette: {
    primary: { main: "#137fec" },
    background: { default: "#f8fafc" }
  },
  typography: {
    fontFamily: ["Inter", "Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", "Noto Sans KR", "sans-serif"].join(",")
  },
  shape: { borderRadius: 10 }
});
