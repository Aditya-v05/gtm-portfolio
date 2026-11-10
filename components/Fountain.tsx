// The source of the water: the user's own pixel-art statue, pouring from an
// amphora into a basin (public/art/water-statue.png). The picture already
// shows the pour and the water leaving under the basin; <Stream /> picks the
// water up where the picture ends. `exit` is where that is, in image pixels.
export const FOUNTAIN_GRID = { w: 730, h: 945, exit: [146, 945] } as const;

export default function Fountain() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="fountain" src="/art/water-statue.png" alt="" width={730} height={945} />;
}
