import doodles from "./doodles.json";

export type DoodleName = keyof typeof doodles;

// One of the user's own ballpoint doodles, cut out of a photographed sheet by
// scripts/prepare-doodles.mjs. The PNG is used as a mask and filled with the
// current ink colour, so the real pen texture survives and the doodle
// follows the theme. Decorative unless given a label.
export default function Doodle({
  name,
  width = 90,
  rotate = 0,
  label,
  className = "",
  style,
}: {
  name: DoodleName;
  width?: number;
  rotate?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { w, h } = doodles[name];
  const url = `url(/doodles/${name}.png)`;
  return (
    <span
      className={`doodle ${className}`.trim()}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        ...style,
        width,
        aspectRatio: `${w} / ${h}`,
        WebkitMaskImage: url,
        maskImage: url,
        transform: `${style?.transform ?? ""} rotate(${rotate}deg)`.trim(),
      }}
    />
  );
}
