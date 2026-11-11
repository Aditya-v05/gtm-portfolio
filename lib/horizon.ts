// Where the closing scene's sea meets the sky, in pixels from the top of the section: a short way under the
// contact text, so the sea fills everything below it and never touches the links. The sea and the page's last
// waterfall both use this, so they agree.
export function seaHorizon(section: HTMLElement): number {
  const h = section.offsetHeight;
  const above = section.querySelector<HTMLElement>("[data-above-sea]");
  const bottom = above ? above.offsetTop + above.offsetHeight : h * 0.4;
  return Math.round(Math.min(h * 0.8, bottom + Math.max(36, h * 0.05)));
}
