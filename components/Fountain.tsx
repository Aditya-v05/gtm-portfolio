// The source of the water: the user's own pixel-art statue, pouring from an
// amphora into a basin (public/art/water-statue.png). Over the picture's
// painted pour, a few dashed strokes run down the same curve so the water
// visibly flows. <Stream /> picks the water up where the picture ends;
// `exit` is where that is, in image pixels.
export const FOUNTAIN_GRID = { w: 730, h: 945, exit: [146, 945] } as const;

// the pour, traced in image pixels: from the amphora's mouth down to the bowl
const POUR = [
  "M150 400 C 138 450, 126 530, 128 640",
  "M160 402 C 148 455, 138 535, 140 640",
  "M170 404 C 160 460, 150 540, 152 640",
];

export default function Fountain() {
  return (
    <div className="fountain">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/water-statue.png" alt="" width={730} height={945} />
      <svg className="fountain__pour" viewBox="0 0 730 945" aria-hidden="true">
        {POUR.map((d, i) => (
          <path key={i} d={d} style={{ animationDelay: `${-i * 0.37}s` }} />
        ))}
        <path className="fountain__drip" d="M146 935 V945" />
      </svg>
    </div>
  );
}
