"use client";

import ClickSpark from "./ClickSpark";
import DotField from "./DotField";
import { useTheme } from "./theme";

const PALETTES = {
  light: {
    spark: "#2F6A47",
    dotFrom: "#55855F",
    dotTo: "#B9C7AE",
    glow: "#2F6A47",
    // a dark radial glow reads as a stain on parchment — dots only
    glowRadius: 0,
  },
  dark: {
    spark: "#E8A33D",
    dotFrom: "#96763E",
    dotTo: "#4A3A20",
    glow: "#F2C078",
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
