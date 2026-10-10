export interface PrimaryColorPreset {
  id: string;
  name: string;
  hex: string;
  // HSL string format: "h s% l%"
  lightHsl: string;
  darkHsl: string;
  // Primary foreground HSL
  lightForegroundHsl?: string;
  darkForegroundHsl?: string;
  // Chart colors derived for this preset
  chart1?: string;
}

export const PRIMARY_COLOR_PRESETS: PrimaryColorPreset[] = [
  {
    id: "blue",
    name: "Blue",
    hex: "#2563eb",
    lightHsl: "221.2 83.2% 53.3%",
    darkHsl: "217.2 91.2% 59.8%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "221.2 83.2% 53.3%",
  },
  {
    id: "indigo",
    name: "Indigo",
    hex: "#4f46e5",
    lightHsl: "243 75.4% 58.6%",
    darkHsl: "243 75.4% 65%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "243 75.4% 58.6%",
  },
  {
    id: "violet",
    name: "Violet",
    hex: "#7c3aed",
    lightHsl: "262.1 83.3% 57.8%",
    darkHsl: "263.4 70% 50.4%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "262.1 83.3% 57.8%",
  },
  {
    id: "emerald",
    name: "Emerald",
    hex: "#059669",
    lightHsl: "160 84% 39%",
    darkHsl: "158 64% 52%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "160 84% 39%",
  },
  {
    id: "teal",
    name: "Teal",
    hex: "#0d9488",
    lightHsl: "174.7 83.9% 31.6%",
    darkHsl: "172.5 66% 50.4%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "174.7 83.9% 31.6%",
  },
  {
    id: "rose",
    name: "Rose",
    hex: "#e11d48",
    lightHsl: "346.8 77.2% 49.8%",
    darkHsl: "349.7 89.2% 60.2%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "346.8 77.2% 49.8%",
  },
  {
    id: "orange",
    name: "Orange",
    hex: "#ea580c",
    lightHsl: "20.5 90.2% 48.2%",
    darkHsl: "20.5 90.2% 54%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "20.5 90.2% 48.2%",
  },
  {
    id: "cyan",
    name: "Cyan",
    hex: "#0891b2",
    lightHsl: "191.6 91.4% 36.5%",
    darkHsl: "188.7 94.5% 42.7%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "191.6 91.4% 36.5%",
  },
  {
    id: "red",
    name: "Red",
    hex: "#dc2626",
    lightHsl: "0 72.2% 50.6%",
    darkHsl: "0 72.2% 58%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "0 0% 100%",
    chart1: "0 72.2% 50.6%",
  },
  {
    id: "slate",
    name: "Slate",
    hex: "#475569",
    lightHsl: "215.4 19.3% 34.5%",
    darkHsl: "215 20.2% 65.1%",
    lightForegroundHsl: "0 0% 100%",
    darkForegroundHsl: "222.2 47.4% 11.2%",
    chart1: "215.4 19.3% 34.5%",
  },
];

export const DEFAULT_PRIMARY_COLOR_ID = "indigo";

/**
 * Converts a hex color string to HSL { h, s, l }
 */
export function hexToHsl(hexStr: string): { h: number; s: number; l: number } | null {
  let hex = hexStr.replace(/^#/, "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Validates a HEX color and produces compatible HSL tokens for Light and Dark modes
 */
export function deriveCustomPrimary(hex: string): {
  lightHsl: string;
  darkHsl: string;
  lightForegroundHsl: string;
  darkForegroundHsl: string;
} | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;

  const { h, s, l } = hsl;

  // Light mode primary
  const lightL = Math.max(30, Math.min(l, 60));
  const lightHsl = `${h} ${s}% ${lightL}%`;

  // Dark mode primary (slightly brighter for contrast on dark background)
  const darkL = Math.max(45, Math.min(l + 10, 75));
  const darkHsl = `${h} ${s}% ${darkL}%`;

  // Foreground: choose pure white or dark based on perceived luminance
  const isLightBackground = l > 65;
  const lightForegroundHsl = isLightBackground ? "222.2 84% 4.9%" : "0 0% 100%";
  const darkForegroundHsl = "0 0% 100%";

  return {
    lightHsl,
    darkHsl,
    lightForegroundHsl,
    darkForegroundHsl,
  };
}
