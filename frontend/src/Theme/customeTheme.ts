import { createTheme } from "@mui/material";

const customeTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F172A", // Deep Midnight Obsidian
      dark: "#020617",
      light: "#1E293B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#2563EB", // Vibrant Royal Sapphire Accent
      dark: "#1D4ED8",
      light: "#3B82F6",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FAFAFA", // Ultra-clean premium canvas
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A", // Rich Charcoal
      secondary: "#64748B", // Muted Slate
    },
    divider: "#E2E8F0",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          fontWeight: 600,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
          },
        },
        containedPrimary: {
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "#1E293B",
          },
        },
        outlinedPrimary: {
          borderColor: "#E2E8F0",
          color: "#0F172A",
          "&:hover": {
            borderColor: "#CBD5E1",
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          borderColor: "#E2E8F0",
          transition: "border-color 0.2s ease-in-out",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#CBD5E1",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0F172A",
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default customeTheme;