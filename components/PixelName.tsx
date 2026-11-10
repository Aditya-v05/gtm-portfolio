// The name, in the hand-lettered display face. It simply sits there: no
// entrance animation.
export default function PixelName({ children }: { children: string }) {
  return <span className="pixelname__text">{children}</span>;
}
