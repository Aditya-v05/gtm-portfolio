"use client";

import ClickSpark from "./ClickSpark";
import DotField from "./DotField";
import { useTheme } from "./theme";

const PALETTES = {
  light: {
    // drafting paper: blue survey dots on pale blueprint stock
    spark: "#2464A4",
    dotFrom: "#5583B5",
    dotTo: "#AFC4D8",
    glow: "#2464A4",
    // a dark radial glow reads as a stain on light paper — dots only
    glowRadius: 0,
  },
  dark: {
    // cyanotype: pale blue dots on deep blueprint
    spark: "#63AEF2",
    dotFrom: "#3E6D9E",
    dotTo: "#1C3350",
    glow: "#8CC5F8",
    glowRadius: 160,
  },
};

export function ThemedClickSpark() {
  const p = PALETTES[useTheme()];
  return (
    <ClickSpark
      key={p.spark}
      sparkColor={p.spark}
      sparkSize={9}
      sparkRadius={22}
      sparkCount={8}
      duration={450}
    />
  );
}

export function ThemedDotField() {
  const theme = useTheme();
  const p = PALETTES[theme];
  return (
    <DotField
      key={theme}
      dotRadius={1.6}
      dotSpacing={18}
      gradientFrom={p.dotFrom}
      gradientTo={p.dotTo}
      glowColor={p.glow}
      glowRadius={p.glowRadius}
      sparkle
      cursorRadius={140}
      waveAmplitude={2.5}
    />
  );
}
